
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'cashier', 'chef');

-- 2. User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 5. Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_pizza BOOLEAN NOT NULL DEFAULT false,
  price_small NUMERIC(10,2),
  price_medium NUMERIC(10,2),
  price_large NUMERIC(10,2),
  price NUMERIC(10,2),
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 6. Pizza crusts
CREATE TABLE public.pizza_crusts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  extra_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pizza_crusts ENABLE ROW LEVEL SECURITY;

-- 7. Pizza addons
CREATE TABLE public.pizza_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pizza_addons ENABLE ROW LEVEL SECURITY;

-- 8. Orders table
CREATE TYPE public.order_type AS ENUM ('dine_in', 'takeaway', 'delivery');
CREATE TYPE public.order_status AS ENUM ('new', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  order_type order_type NOT NULL DEFAULT 'dine_in',
  table_number INT,
  status order_status NOT NULL DEFAULT 'new',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method,
  paid_at TIMESTAMPTZ,
  special_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 9. Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size TEXT,
  crust_id UUID REFERENCES public.pizza_crusts(id),
  unit_price NUMERIC(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 10. Order item addons
CREATE TABLE public.order_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES public.pizza_addons(id) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;

-- 11. Business settings
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- 12. Security definer functions for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_cashier()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'cashier')
$$;

CREATE OR REPLACE FUNCTION public.is_chef()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'chef')
$$;

-- 13. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. RLS Policies

-- user_roles: only admins can manage, authenticated can read own
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- profiles: authenticated can read all, update own, admin can manage all
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- categories: authenticated can read, admin can manage
CREATE POLICY "Authenticated can read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

-- menu_items: authenticated can read, admin can manage
CREATE POLICY "Authenticated can read menu items" ON public.menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (public.is_admin());

-- pizza_crusts: authenticated can read, admin can manage
CREATE POLICY "Authenticated can read crusts" ON public.pizza_crusts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert crusts" ON public.pizza_crusts FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update crusts" ON public.pizza_crusts FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete crusts" ON public.pizza_crusts FOR DELETE TO authenticated USING (public.is_admin());

-- pizza_addons: authenticated can read, admin can manage
CREATE POLICY "Authenticated can read addons" ON public.pizza_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert addons" ON public.pizza_addons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update addons" ON public.pizza_addons FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete addons" ON public.pizza_addons FOR DELETE TO authenticated USING (public.is_admin());

-- orders: admin/cashier can create, all authenticated can read, chef can update status
CREATE POLICY "Authenticated can read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Cashier can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_cashier());
CREATE POLICY "Admin/Cashier/Chef can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_cashier() OR public.is_chef());
CREATE POLICY "Admin can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.is_admin());

-- order_items: follow order access
CREATE POLICY "Authenticated can read order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Cashier can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_cashier());
CREATE POLICY "Admin/Cashier can update order items" ON public.order_items FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_cashier());
CREATE POLICY "Admin/Cashier can delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.is_admin() OR public.is_cashier());

-- order_item_addons: follow order access
CREATE POLICY "Authenticated can read order item addons" ON public.order_item_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Cashier can create order item addons" ON public.order_item_addons FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_cashier());
CREATE POLICY "Admin/Cashier can update order item addons" ON public.order_item_addons FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_cashier());
CREATE POLICY "Admin/Cashier can delete order item addons" ON public.order_item_addons FOR DELETE TO authenticated USING (public.is_admin() OR public.is_cashier());

-- business_settings: authenticated can read, admin can manage
CREATE POLICY "Authenticated can read settings" ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert settings" ON public.business_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings" ON public.business_settings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete settings" ON public.business_settings FOR DELETE TO authenticated USING (public.is_admin());

-- 16. Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_item_addons;
