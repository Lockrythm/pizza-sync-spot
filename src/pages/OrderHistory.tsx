import { ClipboardList } from "lucide-react";

export default function OrderHistory() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <ClipboardList className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Order History</h2>
      <p>Record keeping coming in Phase 8</p>
    </div>
  );
}
