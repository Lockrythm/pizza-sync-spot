import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";

interface ReceiptItem {
  name: string;
  quantity: number;
  size: string | null;
  crustName: string | null;
  addons: string[];
  unitPrice: number;
  lineTotal: number;
}

interface ReceiptData {
  businessName: string;
  address: string;
  contact: string;
  orderNumber: number;
  orderType: string;
  tableNumber: number | null;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
  type: "customer" | "kitchen";
}

const orderTypeLabels: Record<string, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export default function ReceiptDialog({ open, onOpenChange, data, type }: ReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=320,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>${type === "customer" ? "Receipt" : "Kitchen Slip"}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .items { margin: 4px 0; }
        .item-detail { font-size: 11px; color: #555; padding-left: 8px; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const isKitchen = type === "kitchen";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{isKitchen ? "Kitchen Slip" : "Customer Receipt"}</DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="text-xs font-mono space-y-1">
          {/* Header */}
          <div className="text-center">
            <p className="font-bold text-sm">{data.businessName}</p>
            {!isKitchen && (
              <>
                <p>{data.address}</p>
                <p>{data.contact}</p>
              </>
            )}
          </div>
          <div className="border-t border-dashed border-foreground/30 my-1" />

          <div className="flex justify-between">
            <span className="font-bold">Order #{data.orderNumber}</span>
            <span>{orderTypeLabels[data.orderType] ?? data.orderType}</span>
          </div>
          {data.tableNumber && <p>Table: {data.tableNumber}</p>}
          <p>{data.date}</p>

          <div className="border-t border-dashed border-foreground/30 my-1" />

          {/* Items */}
          <div className="space-y-1">
            {data.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span>{item.quantity}× {item.name}</span>
                  {!isKitchen && <span>£{item.lineTotal.toFixed(2)}</span>}
                </div>
                {item.size && (
                  <p className="text-muted-foreground pl-2 text-[10px]">
                    {item.size}{item.crustName ? `, ${item.crustName}` : ""}
                  </p>
                )}
                {item.addons.length > 0 && (
                  <p className="text-muted-foreground pl-2 text-[10px]">+{item.addons.join(", ")}</p>
                )}
              </div>
            ))}
          </div>

          {!isKitchen && (
            <>
              <div className="border-t border-dashed border-foreground/30 my-1" />
              <div className="flex justify-between"><span>Subtotal</span><span>£{data.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax ({data.taxPercent}%)</span><span>£{data.taxAmount.toFixed(2)}</span></div>
              {data.discountAmount > 0 && (
                <div className="flex justify-between"><span>Discount</span><span>-£{data.discountAmount.toFixed(2)}</span></div>
              )}
              <div className="border-t border-dashed border-foreground/30 my-1" />
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>£{data.total.toFixed(2)}</span>
              </div>
              <p className="text-center mt-1">Paid by: {data.paymentMethod.toUpperCase()}</p>
              <div className="border-t border-dashed border-foreground/30 my-1" />
              <p className="text-center">Thank you!</p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handlePrint} className="w-full" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
