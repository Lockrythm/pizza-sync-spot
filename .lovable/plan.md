

# LiveSync Pizza POS — Implementation Plan

## Overview
A cloud-based, real-time Pizza Shop POS system with multi-device sync, kitchen display, billing, dual printing, analytics, and role-based access. Currency: **GBP (£)**. Uses **Supabase** for backend (database, auth, real-time sync).

---

## Phase 1: Foundation & Authentication
- **Supabase Cloud setup** — database, auth, real-time subscriptions
- **Login system** with role-based access: **Admin**, **Cashier**, **Chef**
- Role stored in a secure `user_roles` table
- Admin can create/manage user accounts
- Session timeout after inactivity

---

## Phase 2: Menu Management
- **Categories**: Pizza, Sandwiches/Burgers, Sides, Drinks (admin can add more)
- **Pizza-specific options**: 3 sizes (S/M/L), 5 crust types, 8 add-ons
- Each item has: name, category, selling price (per size for pizza), cost price, enabled/disabled toggle
- Admin panel to add, edit, delete, enable/disable menu items
- Preloaded with 15 classic pizzas from the PRD

---

## Phase 3: Order Creation & Management
- **Fast order entry screen** for Cashier — tap items, select size/crust/add-ons, add special notes per item
- **Order types**: Dine-in (with table 1–20), Takeaway, Delivery
- **Order statuses**: New → Preparing → Ready → Completed / Cancelled
- Table management: assign, merge, transfer tables
- Special instructions per item (free text: "No onions", "Extra spicy")

---

## Phase 4: Real-Time Kitchen Display
- **Kitchen screen** — shows incoming orders instantly via Supabase Realtime
- Displays: order number, items, quantities, special notes, order time — **no prices**
- Chef can tap to mark orders as "Preparing" → "Ready"
- All status changes sync to all devices within 1 second
- Orders auto-appear when cashier creates them — **no need to walk to the kitchen**

---

## Phase 5: Billing & Payments
- Auto-calculated subtotal, configurable tax %, discount (fixed or %)
- Payment methods: Cash, Card
- Full invoice/receipt with: business name, address, contact, order number, date/time, itemized list, subtotal, tax, discount, total, payment method
- Cashier marks order as "Completed" after payment

---

## Phase 6: Dual Printing (Browser Print)
- **Counter receipt** — full customer receipt with pricing (browser print dialog)
- **Kitchen slip** — order number, items, quantities, notes, time — **no pricing**
- Auto-trigger: kitchen slip on order creation, customer receipt on payment
- Print preview formatted for receipt-style layout

---

## Phase 7: Analytics & Profit Dashboard (Admin Only)
- **Dashboard cards**: today's sales, today's orders, monthly sales, monthly profit, top pizza, average order value
- **Charts**: daily sales bar chart (7 days), monthly revenue line chart, best-selling pizza pie chart, hourly sales bar chart
- **Profit tracking**: profit per item (selling - cost price), most profitable item, daily/monthly profit totals
- Date range filters for all reports
- **CSV export** for sales data

---

## Phase 8: Record Keeping & Search
- All orders, items, payments, status changes stored persistently
- Search by date range, order number
- Filter by payment method, order type
- Full order history accessible to Admin, limited view for Cashier

---

## Key Technical Approach
- **Supabase Realtime** for instant multi-device sync (no page refresh needed)
- **Role-based RLS policies** so Chef never sees pricing, Cashier can't access admin features
- **Responsive design** — works on laptops and tablets
- All data in GBP (£)

