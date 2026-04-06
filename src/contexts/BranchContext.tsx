import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Branch {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  contact: string | null;
  is_active: boolean;
  created_at: string;
}

interface BranchContextType {
  branches: Branch[];
  activeBranchId: string | null;
  activeBranch: Branch | null;
  setActiveBranchId: (id: string | null) => void;
  loading: boolean;
  isSuperAdmin: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    if (!user) {
      setBranches([]);
      setActiveBranchId(null);
      setLoading(false);
      return;
    }

    const fetchBranches = async () => {
      setLoading(true);
      try {
        if (isSuperAdmin) {
          // Super admin sees all branches
          const { data } = await supabase
            .from("branches")
            .select("*")
            .eq("is_active", true)
            .order("name");
          setBranches((data as Branch[]) ?? []);
        } else {
          // Regular user sees only assigned branches
          const { data: assignments } = await supabase
            .from("user_branches")
            .select("branch_id")
            .eq("user_id", user.id);

          const branchIds = (assignments ?? []).map((a: any) => a.branch_id);
          if (branchIds.length > 0) {
            const { data } = await supabase
              .from("branches")
              .select("*")
              .in("id", branchIds)
              .eq("is_active", true)
              .order("name");
            setBranches((data as Branch[]) ?? []);
          } else {
            setBranches([]);
          }
        }
      } catch (err) {
        console.error("[Branch] fetch error:", err);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [user, isSuperAdmin]);

  // Auto-select first branch or restore from localStorage
  useEffect(() => {
    if (branches.length === 0) return;
    const saved = localStorage.getItem("activeBranchId");
    if (saved && branches.find((b) => b.id === saved)) {
      setActiveBranchId(saved);
    } else {
      setActiveBranchId(branches[0].id);
    }
  }, [branches]);

  // Persist selection
  useEffect(() => {
    if (activeBranchId) {
      localStorage.setItem("activeBranchId", activeBranchId);
    }
  }, [activeBranchId]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? null;

  return (
    <BranchContext.Provider
      value={{ branches, activeBranchId, activeBranch, setActiveBranchId, loading, isSuperAdmin }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error("useBranch must be used within BranchProvider");
  return context;
}
