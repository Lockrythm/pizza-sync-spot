import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";

export function useBusinessSettings() {
  const { activeBranchId, isSuperAdmin } = useBranch();
  const isAll = isSuperAdmin && activeBranchId === "all";

  return useQuery({
    queryKey: ["business_settings", activeBranchId],
    queryFn: async () => {
      let q = supabase.from("business_settings").select("key, value");
      if (!isAll && activeBranchId) q = q.eq("branch_id", activeBranchId);
      const { data, error } = await q;
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => (map[r.key] = r.value));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}
