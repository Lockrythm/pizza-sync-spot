
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- business_settings
DROP POLICY IF EXISTS "Admins can delete settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.business_settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.business_settings;

CREATE POLICY "Admins can delete settings" ON public.business_settings FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert settings" ON public.business_settings FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings" ON public.business_settings FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Authenticated can read settings" ON public.business_settings FOR SELECT TO authenticated USING (true);

-- categories
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can read categories" ON public.categories;

CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Authenticated can read categories" ON public.categories FOR SELECT TO authenticated USING (true);

-- menu_items
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can read menu items" ON public.menu_items;

CREATE POLICY "Admins can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Authenticated can read menu items" ON public.menu_items FOR SELECT TO authenticated USING (true);

-- order_item_addons
DROP POLICY IF EXISTS "Admin/Cashier can create order item addons" ON public.order_item_addons;
DROP POLICY IF EXISTS "Admin/Cashier can delete order item addons" ON public.order_item_addons;
DROP POLICY IF EXISTS "Admin/Cashier can update order item addons" ON public.order_item_addons;
DROP POLICY IF EXISTS "Authenticated can read order item addons" ON public.order_item_addons;

CREATE POLICY "Admin/Cashier can create order item addons" ON public.order_item_addons FOR INSERT TO authenticated WITH CHECK (is_admin() OR is_cashier());
CREATE POLICY "Admin/Cashier can delete order item addons" ON public.order_item_addons FOR DELETE TO authenticated USING (is_admin() OR is_cashier());
CREATE POLICY "Admin/Cashier can update order item addons" ON public.order_item_addons FOR UPDATE TO authenticated USING (is_admin() OR is_cashier());
CREATE POLICY "Authenticated can read order item addons" ON public.order_item_addons FOR SELECT TO authenticated USING (true);

-- order_items
DROP POLICY IF EXISTS "Admin/Cashier can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin/Cashier can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin/Cashier can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated can read order items" ON public.order_items;

CREATE POLICY "Admin/Cashier can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (is_admin() OR is_cashier());
CREATE POLICY "Admin/Cashier can delete order items" ON public.order_items FOR DELETE TO authenticated USING (is_admin() OR is_cashier());
CREATE POLICY "Admin/Cashier can update order items" ON public.order_items FOR UPDATE TO authenticated USING (is_admin() OR is_cashier());
CREATE POLICY "Authenticated can read order items" ON public.order_items FOR SELECT TO authenticated USING (true);

-- orders
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admin/Cashier can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admin/Cashier/Chef can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;

CREATE POLICY "Admin can delete orders" ON public.orders FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admin/Cashier can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (is_admin() OR is_cashier());
CREATE POLICY "Admin/Cashier/Chef can update orders" ON public.orders FOR UPDATE TO authenticated USING (is_admin() OR is_cashier() OR is_chef());
CREATE POLICY "Authenticated can read orders" ON public.orders FOR SELECT TO authenticated USING (true);

-- pizza_addons
DROP POLICY IF EXISTS "Admins can delete addons" ON public.pizza_addons;
DROP POLICY IF EXISTS "Admins can insert addons" ON public.pizza_addons;
DROP POLICY IF EXISTS "Admins can update addons" ON public.pizza_addons;
DROP POLICY IF EXISTS "Authenticated can read addons" ON public.pizza_addons;

CREATE POLICY "Admins can delete addons" ON public.pizza_addons FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert addons" ON public.pizza_addons FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update addons" ON public.pizza_addons FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Authenticated can read addons" ON public.pizza_addons FOR SELECT TO authenticated USING (true);

-- pizza_crusts
DROP POLICY IF EXISTS "Admins can delete crusts" ON public.pizza_crusts;
DROP POLICY IF EXISTS "Admins can insert crusts" ON public.pizza_crusts;
DROP POLICY IF EXISTS "Admins can update crusts" ON public.pizza_crusts;
DROP POLICY IF EXISTS "Authenticated can read crusts" ON public.pizza_crusts;

CREATE POLICY "Admins can delete crusts" ON public.pizza_crusts FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert crusts" ON public.pizza_crusts FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update crusts" ON public.pizza_crusts FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Authenticated can read crusts" ON public.pizza_crusts FOR SELECT TO authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_admin());

-- user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
