import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <BarChart3 className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Analytics Dashboard</h2>
      <p>Charts & profit tracking coming in Phase 7</p>
    </div>
  );
}
