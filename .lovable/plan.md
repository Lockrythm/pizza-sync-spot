

## Plan: Fix Issues and Ensure Super Admin Full Access

### Problems Identified

1. **Auth loading flicker / "No role assigned"**: The `BranchContext` depends on `role` from `AuthContext`, but both run effects simultaneously. When `BranchContext` starts fetching before `AuthContext` resolves the role, `isSuperAdmin` is false, causing wrong branch data. Also, the `onAuthStateChange` listener can fire a `TOKEN_REFRESHED` event during initial load before `initialised` is set to `true`, racing with `initializeAuth`.

2. **`BranchContext` loading not gated in `AppLayout`**: The `AppLayout` only checks `AuthContext.loading` but not `BranchContext.loading`. If branch data hasn't loaded yet, hooks that depend on `activeBranchId` fire with `null`, returning empty data.

3. **Super Admin should have full control**: Super Admin needs access to all pages and all operations. The sidebar nav and RLS are correct, but the route-level access isn't guarded — any role can navigate to any route via URL. Need to add route guards.

4. **`useCreateOrder` uses `activeBranchId === "all"` → `undefined`**: When super admin has "All Branches" selected and tries to create an order, `branch_id` becomes `undefined` which will fail or create orphaned orders.

### Changes

**1. Fix AuthContext race condition (src/contexts/AuthContext.tsx)**
- Use a ref for `initialised` instead of a closure variable so it's shared reliably
- Ensure `onAuthStateChange` waits for `initializeAuth` to complete before processing events
- On `SIGNED_OUT`, clear role immediately

**2. Gate AppLayout on BranchContext loading (src/components/AppLayout.tsx)**
- Import `useBranch` and check `branchLoading` alongside `authLoading`
- Show spinner until both auth and branch context are ready

**3. Add route guards for role-based access (src/App.tsx)**
- Wrap routes with a guard component that checks if the current role has access
- Chef can only access `/kitchen`, cashier can access `/orders`, `/kitchen`, `/history`
- Super admin and admin can access everything
- Redirect unauthorized access to the user's default page

**4. Fix "All Branches" edge cases**
- In `useCreateOrder`: if `activeBranchId` is `"all"`, show an error toast requiring branch selection before creating orders
- In `BranchSwitcher`: when super admin selects "All Branches", disable order creation in the Orders page

**5. Ensure super admin equivalence to admin everywhere**
- Already fixed in previous migration (`is_admin()` includes `super_admin`)
- `OrderHistory.tsx` already updated with `role === "admin" || role === "super_admin"`
- No remaining frontend exclusions found

### Files to Edit
- `src/contexts/AuthContext.tsx` — fix race condition with ref-based flag
- `src/components/AppLayout.tsx` — gate on branch loading
- `src/App.tsx` — add role-based route guards
- `src/hooks/useOrders.ts` — guard against "all" branch for order creation
- `src/pages/Orders.tsx` — show warning when "All Branches" is selected

### No database migration needed
All RLS functions already include super_admin properly.

