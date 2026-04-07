

## Plan: Fix Bugs and Sidebar Issues

### Bugs Identified

1. **`is_admin()` SQL function excludes Super Admins** — The `is_admin()` helper only checks for `role = 'admin'`, meaning Super Admins cannot create/update/delete menu items, categories, crusts, addons, order items, business settings, or user roles. This is the most critical bug.

2. **Role checks in OrderHistory UI** — `role === "admin"` excludes `super_admin` from seeing payment method, total, and financial details in order history and detail dialogs.

3. **Notifications hook placement** — `useNotifications()` is called inside `RoleRedirect` which unmounts immediately on redirect, killing the notification subscription.

4. **Auth race condition** — Both `onAuthStateChange` and `initializeAuth` run simultaneously and can overwrite each other's role state, occasionally showing "No role assigned."

### Changes

**1. Database Migration — Fix `is_admin()` function**
Update `is_admin()` to also return `true` for `super_admin` role:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
$$;
```
This single change fixes all RLS policies for menu, categories, crusts, addons, orders, order_items, business_settings, and user_roles.

**2. Fix role checks in frontend pages**
- `OrderHistory.tsx`: Change `role === "admin"` to `role === "admin" || role === "super_admin"` (4 occurrences)
- Any other page with hardcoded `role === "admin"` checks

**3. Move `useNotifications` to `AppLayout`**
- Remove from `RoleRedirect` in `App.tsx`
- Add to `AppLayout` component so it persists while the user is logged in

**4. Fix Auth race condition in `AuthContext.tsx`**
- Prevent `onAuthStateChange` from overwriting the role resolved by `initializeAuth` during initial load
- Use a flag to skip the first `onAuthStateChange` event (which duplicates `getSession`)

**5. Sidebar mobile improvements**
- Ensure the mobile hamburger menu Sheet closes properly after navigation
- Verify sidebar renders correctly at 360px viewport

### Files to Edit
- **New migration SQL** — update `is_admin()` function
- `src/pages/OrderHistory.tsx` — fix role checks
- `src/App.tsx` — move useNotifications
- `src/components/AppLayout.tsx` — add useNotifications here
- `src/contexts/AuthContext.tsx` — fix race condition

