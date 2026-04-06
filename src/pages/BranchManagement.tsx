import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BranchRow {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  contact: string | null;
  is_active: boolean;
  created_at: string;
  staff_count?: number;
}

function useBranches() {
  return useQuery({
    queryKey: ["all_branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Get staff counts
      const { data: assignments } = await supabase
        .from("user_branches")
        .select("branch_id");

      const countMap: Record<string, number> = {};
      (assignments ?? []).forEach((a: any) => {
        countMap[a.branch_id] = (countMap[a.branch_id] ?? 0) + 1;
      });

      return (data ?? []).map((b: any) => ({
        ...b,
        staff_count: countMap[b.id] ?? 0,
      })) as BranchRow[];
    },
  });
}

export default function BranchManagement() {
  const { data: branches, isLoading } = useBranches();
  const [formOpen, setFormOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchRow | null>(null);
  const [deleteBranch, setDeleteBranch] = useState<BranchRow | null>(null);
  const [staffBranch, setStaffBranch] = useState<BranchRow | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("branches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all_branches"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Branch deleted" });
      qc.invalidateQueries({ queryKey: ["all_branches"] });
      setDeleteBranch(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Branch Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage branches</p>
        </div>
        <Button onClick={() => { setEditBranch(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Branch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" /> Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !branches?.length ? (
            <p className="text-center text-muted-foreground py-8">No branches found</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">City</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{b.city ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b.staff_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={b.is_active}
                          onCheckedChange={(checked) => toggleActive.mutate({ id: b.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStaffBranch(b)} title="Manage staff">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditBranch(b); setFormOpen(true); }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteBranch(b)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branch Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBranch ? "Edit Branch" : "Create Branch"}</DialogTitle>
          </DialogHeader>
          <BranchForm
            initial={editBranch}
            onSuccess={() => { setFormOpen(false); setEditBranch(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Staff Assignment */}
      <Dialog open={!!staffBranch} onOpenChange={(open) => !open && setStaffBranch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Staff — {staffBranch?.name}</DialogTitle>
          </DialogHeader>
          {staffBranch && <StaffAssignment branchId={staffBranch.id} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBranch} onOpenChange={(open) => !open && setDeleteBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteBranch?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this branch and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteBranch && deleteMutation.mutate(deleteBranch.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BranchForm({ initial, onSuccess }: { initial: BranchRow | null; onSuccess: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (initial) {
        const { error } = await supabase.from("branches").update({ name, city, address, contact }).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert({ name, city, address, contact });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: initial ? "Branch updated" : "Branch created" });
      qc.invalidateQueries({ queryKey: ["all_branches"] });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div className="space-y-2">
        <Label>Branch Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Downtown Branch" />
      </div>
      <div className="space-y-2">
        <Label>City</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
      </div>
      <div className="space-y-2">
        <Label>Contact</Label>
        <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+44 123 456 7890" />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending || !name.trim()}>
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {initial ? "Update" : "Create"} Branch
      </Button>
    </form>
  );
}

function StaffAssignment({ branchId }: { branchId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: allUsers } = useQuery({
    queryKey: ["all_staff_for_branch"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
      return (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        role: roleMap.get(p.user_id) ?? null,
      }));
    },
  });

  const { data: assigned } = useQuery({
    queryKey: ["branch_staff", branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_branches")
        .select("user_id")
        .eq("branch_id", branchId);
      return new Set((data ?? []).map((a: any) => a.user_id));
    },
  });

  const toggleAssignment = useMutation({
    mutationFn: async ({ userId, assign }: { userId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase.from("user_branches").insert({ user_id: userId, branch_id: branchId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_branches").delete().eq("user_id", userId).eq("branch_id", branchId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branch_staff", branchId] });
      qc.invalidateQueries({ queryKey: ["all_branches"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!allUsers || !assigned) {
    return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-2 max-h-80 overflow-auto">
      {allUsers.map((u: any) => {
        const isAssigned = assigned.has(u.user_id);
        return (
          <div key={u.user_id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50">
            <div>
              <p className="text-sm font-medium">{u.display_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{u.role ?? "No role"}</p>
            </div>
            <Switch
              checked={isAssigned}
              onCheckedChange={(checked) => toggleAssignment.mutate({ userId: u.user_id, assign: checked })}
            />
          </div>
        );
      })}
    </div>
  );
}
