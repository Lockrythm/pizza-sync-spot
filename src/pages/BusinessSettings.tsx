import { Settings } from "lucide-react";

export default function BusinessSettings() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <Settings className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Business Settings</h2>
      <p>Settings panel coming soon</p>
    </div>
  );
}
