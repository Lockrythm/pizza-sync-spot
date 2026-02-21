import { Pizza } from "lucide-react";

export default function MenuManagement() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <Pizza className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Menu Management</h2>
      <p>Menu admin panel coming in Phase 2</p>
    </div>
  );
}
