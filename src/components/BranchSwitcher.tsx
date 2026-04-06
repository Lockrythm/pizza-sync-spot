import { useBranch } from "@/contexts/BranchContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export default function BranchSwitcher() {
  const { branches, activeBranchId, setActiveBranchId, isSuperAdmin } = useBranch();

  if (branches.length <= 1 && !isSuperAdmin) return null;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60 mb-1 px-1">
        <Building2 className="h-3 w-3" />
        <span>Branch</span>
      </div>
      <Select value={activeBranchId ?? ""} onValueChange={setActiveBranchId}>
        <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {isSuperAdmin && (
            <SelectItem value="all" className="text-xs">
              📊 All Branches
            </SelectItem>
          )}
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
