import { ChefHat } from "lucide-react";

export default function Kitchen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <ChefHat className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Kitchen Display</h2>
      <p>Real-time kitchen screen coming in Phase 4</p>
    </div>
  );
}
