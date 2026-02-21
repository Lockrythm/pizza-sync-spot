import { useState } from "react";
import { format } from "date-fns";
import { ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrderHistory, type HistoryFilters } from "@/hooks/useOrderHistory";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 20;

export default function OrderHistory() {
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<HistoryFilters>({
    from: null,
    to: null,
    orderNumber: "",
    paymentMethod: "",
    orderType: "",
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = useOrderHistory(filters, page, PAGE_SIZE);
  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateFilter = (key: keyof HistoryFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: key === "from" || key === "to" ? (value ? new Date(value) : null) : value }));
    setPage(0);
  };

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <ClipboardList className="h-5 w-5" /> Order History
      </h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" className="w-36" onChange={(e) => updateFilter("from", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" className="w-36" onChange={(e) => updateFilter("to", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Order #</label>
            <Input
              placeholder="e.g. 42"
              className="w-24"
              value={filters.orderNumber}
              onChange={(e) => updateFilter("orderNumber", e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Payment</label>
            <Select value={filters.paymentMethod} onValueChange={(v) => updateFilter("paymentMethod", v === "all" ? "" : v)}>
              <SelectTrigger className="w-28"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={filters.orderType} onValueChange={(v) => updateFilter("orderType", v === "all" ? "" : v)}>
              <SelectTrigger className="w-28"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="dine_in">Dine-in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {role === "admin" && <TableHead>Payment</TableHead>}
                {role === "admin" && <TableHead className="text-right">Total</TableHead>}
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
              ) : (
                orders.map((order: any) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <TableCell className="font-medium">#{order.order_number}</TableCell>
                    <TableCell>{format(new Date(order.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.order_type.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === "completed" ? "default" : "destructive"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    {role === "admin" && <TableCell>{order.payment_method ?? "—"}</TableCell>}
                    {role === "admin" && <TableCell className="text-right font-medium">£{Number(order.total).toFixed(2)}</TableCell>}
                    <TableCell>
                      <Button variant="ghost" size="sm"><Search className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{format(new Date(selectedOrder.created_at), "dd MMM yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">{selectedOrder.order_type.replace("_", " ")}</Badge>
              </div>
              {selectedOrder.table_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Table</span>
                  <span>{selectedOrder.table_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={selectedOrder.status === "completed" ? "default" : "destructive"}>{selectedOrder.status}</Badge>
              </div>

              <div className="border-t pt-2 space-y-1">
                <p className="font-medium">Items</p>
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}× {item.menu_items?.name ?? "Item"} {item.size ? `(${item.size})` : ""}</span>
                    {role === "admin" && <span>£{(Number(item.unit_price) * item.quantity).toFixed(2)}</span>}
                  </div>
                ))}
              </div>

              {role === "admin" && (
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{Number(selectedOrder.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>£{Number(selectedOrder.tax_amount).toFixed(2)}</span></div>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-£{Number(selectedOrder.discount_amount).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-bold"><span>Total</span><span>£{Number(selectedOrder.total).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{selectedOrder.payment_method ?? "—"}</span></div>
                </div>
              )}

              {selectedOrder.special_notes && (
                <div className="border-t pt-2">
                  <p className="text-muted-foreground">Notes: {selectedOrder.special_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
