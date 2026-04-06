
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_in_branch(_branch_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_branches
    WHERE user_id = auth.uid() AND branch_id = _branch_id
  );
END;
$$;

-- RLS for branches
CREATE POLICY "Super admins can manage branches" ON public.branches FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can read their branches" ON public.branches FOR SELECT TO authenticated USING (id IN (SELECT branch_id FROM public.user_branches WHERE user_id = auth.uid()) OR is_super_admin());

-- RLS for user_branches
CREATE POLICY "Super admins can manage user_branches" ON public.user_branches FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can read user_branches for their branches" ON public.user_branches FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_super_admin() OR branch_id IN (SELECT branch_id FROM public.user_branches WHERE user_id = auth.uid()));

-- Default branch
INSERT INTO public.branches (id, name, city, address, contact)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Branch', 'Default', 'Default Address', '');

-- Backfill existing data
UPDATE public.orders SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.menu_items SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.categories SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.pizza_crusts SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.pizza_addons SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;
UPDATE public.business_settings SET branch_id = '00000000-0000-0000-0000-000000000001' WHERE branch_id IS NULL;

-- Assign all users to default branch
INSERT INTO public.user_branches (user_id, branch_id)
SELECT user_id, '00000000-0000-0000-0000-000000000001' FROM public.user_roles
ON CONFLICT DO NOTHING;

-- Upgrade admin to super_admin
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_branches;
