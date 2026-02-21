import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type MenuItem = Tables<"menu_items">;
export type Category = Tables<"categories">;
export type PizzaCrust = Tables<"pizza_crusts">;
export type PizzaAddon = Tables<"pizza_addons">;

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, categories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function usePizzaCrusts() {
  return useQuery({
    queryKey: ["pizza_crusts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pizza_crusts").select("*").order("name");
      if (error) throw error;
      return data as PizzaCrust[];
    },
  });
}

export function usePizzaAddons() {
  return useQuery({
    queryKey: ["pizza_addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pizza_addons").select("*").order("name");
      if (error) throw error;
      return data as PizzaAddon[];
    },
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<"menu_items">) => {
      const { data, error } = await supabase.from("menu_items").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"menu_items"> & { id: string }) => {
      const { data, error } = await supabase.from("menu_items").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: TablesInsert<"categories">) => {
      const { data, error } = await supabase.from("categories").insert(cat).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCreateCrust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: TablesInsert<"pizza_crusts">) => {
      const { data, error } = await supabase.from("pizza_crusts").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pizza_crusts"] }),
  });
}

export function useUpdateCrust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"pizza_crusts"> & { id: string }) => {
      const { data, error } = await supabase.from("pizza_crusts").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pizza_crusts"] }),
  });
}

export function useDeleteCrust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pizza_crusts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pizza_crusts"] }),
  });
}

export function useCreateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: TablesInsert<"pizza_addons">) => {
      const { data, error } = await supabase.from("pizza_addons").insert(a).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pizza_addons"] }),
  });
}

export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"pizza_addons"> & { id: string }) => {
      const { data, error } = await supabase.from("pizza_addons").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pizza_addons"] }),
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pizza_addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pizza_addons"] }),
  });
}
