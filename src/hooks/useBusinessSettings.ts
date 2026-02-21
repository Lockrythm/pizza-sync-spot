import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBusinessSettings() {
  return useQuery({
    queryKey: ["business_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => (map[r.key] = r.value));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}
