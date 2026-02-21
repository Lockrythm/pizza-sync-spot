export interface PrintReceiptData {
  businessName: string;
  address: string;
  contact: string;
  orderNumber: number;
  orderType: string;
  tableNumber: number | null;
  date: string;
  items: {
    name: string;
    quantity: number;
    size: string | null;
    crustName: string | null;
    addons: string[];
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
}

const orderTypeLabels: Record<string, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

function buildReceiptHtml(data: PrintReceiptData, type: "customer" | "kitchen"): string {
  const isKitchen = type === "kitchen";
  const title = isKitchen ? "Kitchen Slip" : "Receipt";

  let itemsHtml = data.items
    .map((item) => {
      let html = `<div class="row"><span>${item.quantity}× ${item.name}</span>`;
      if (!isKitchen) html += `<span>£${item.lineTotal.toFixed(2)}</span>`;
      html += `</div>`;
      if (item.size) {
        html += `<div class="item-detail">${item.size}${item.crustName ? `, ${item.crustName}` : ""}</div>`;
      }
      if (item.addons.length > 0) {
        html += `<div class="item-detail">+${item.addons.join(", ")}</div>`;
      }
      return html;
    })
    .join("");

  let totalsHtml = "";
  if (!isKitchen) {
    totalsHtml = `
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>£${data.subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Tax (${data.taxPercent}%)</span><span>£${data.taxAmount.toFixed(2)}</span></div>
      ${data.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-£${data.discountAmount.toFixed(2)}</span></div>` : ""}
      <div class="line"></div>
      <div class="row bold" style="font-size:14px"><span>TOTAL</span><span>£${data.total.toFixed(2)}</span></div>
      <div class="center" style="margin-top:4px">Paid by: ${data.paymentMethod.toUpperCase()}</div>
      <div class="line"></div>
      <div class="center">Thank you!</div>
    `;
  }

  return `<html><head><title>${title}</title>
    <style>
      body { font-family: monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; }
      .item-detail { font-size: 11px; color: #555; padding-left: 8px; }
    </style></head><body>
    <div class="center">
      <div class="bold" style="font-size:14px">${data.businessName}</div>
      ${!isKitchen ? `<div>${data.address}</div><div>${data.contact}</div>` : ""}
    </div>
    <div class="line"></div>
    <div class="row"><span class="bold">Order #${data.orderNumber}</span><span>${orderTypeLabels[data.orderType] ?? data.orderType}</span></div>
    ${data.tableNumber ? `<div>Table: ${data.tableNumber}</div>` : ""}
    <div>${data.date}</div>
    <div class="line"></div>
    ${itemsHtml}
    ${totalsHtml}
    <script>window.print(); window.close();<\/script>
    </body></html>`;
}

export function autoPrint(data: PrintReceiptData, type: "customer" | "kitchen") {
  const html = buildReceiptHtml(data, type);
  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
