import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Pizza, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCategories,
  useMenuItems,
  usePizzaCrusts,
  usePizzaAddons,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCreateCategory,
  useCreateCrust,
  useUpdateCrust,
  useDeleteCrust,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
} from "@/hooks/useMenu";
import { MenuItemForm } from "@/components/menu/MenuItemForm";

export default function MenuManagement() {
  const { toast } = useToast();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useMenuItems();
  const { data: crusts = [], isLoading: crustsLoading } = usePizzaCrusts();
  const { data: addons = [], isLoading: addonsLoading } = usePizzaAddons();

  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const createCategory = useCreateCategory();
  const createCrust = useCreateCrust();
  const updateCrust = useUpdateCrust();
  const deleteCrust = useDeleteCrust();
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Category form
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Crust form
  const [crustFormOpen, setCrustFormOpen] = useState(false);
  const [crustName, setCrustName] = useState("");
  const [crustPrice, setCrustPrice] = useState("0");
  const [editingCrust, setEditingCrust] = useState<any>(null);

  // Addon form
  const [addonFormOpen, setAddonFormOpen] = useState(false);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("0");
  const [editingAddon, setEditingAddon] = useState<any>(null);

  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || item.category_id === filterCat;
    return matchesSearch && matchesCat;
  });

  const handleToggleEnabled = async (item: any) => {
    try {
      await updateItem.mutateAsync({ id: item.id, is_enabled: !item.is_enabled });
      toast({ title: `${item.name} ${item.is_enabled ? "disabled" : "enabled"}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "item") await deleteItem.mutateAsync(deleteTarget.id);
      else if (deleteTarget.type === "crust") await deleteCrust.mutateAsync(deleteTarget.id);
      else if (deleteTarget.type === "addon") await deleteAddon.mutateAsync(deleteTarget.id);
      toast({ title: `${deleteTarget.name} deleted` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const isLoading = catLoading || itemsLoading || crustsLoading || addonsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground text-sm">{menuItems.length} items across {categories.length} categories</p>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="crusts">Crusts</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* MENU ITEMS TAB */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterCat === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCat("all")}
              >
                All
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant={filterCat === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCat(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
            <Button onClick={() => { setEditingItem(null); setItemFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Cost</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.is_pizza && <Pizza className="h-4 w-4 text-primary" />}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{item.categories?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.is_pizza ? (
                          <span className="text-xs">
                            £{item.price_small}/{item.price_medium}/{item.price_large}
                          </span>
                        ) : (
                          <span>£{Number(item.price).toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">£{Number(item.cost_price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Switch checked={item.is_enabled} onCheckedChange={() => handleToggleEnabled(item)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingItem(item); setItemFormOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget({ type: "item", id: item.id, name: item.name })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRUSTS TAB */}
        <TabsContent value="crusts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pizza Crusts</h2>
            <Button onClick={() => { setEditingCrust(null); setCrustName(""); setCrustPrice("0"); setCrustFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Crust
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Extra Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crusts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>£{Number(c.extra_price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingCrust(c); setCrustName(c.name); setCrustPrice(c.extra_price.toString()); setCrustFormOpen(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: "crust", id: c.id, name: c.name })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADDONS TAB */}
        <TabsContent value="addons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pizza Add-ons</h2>
            <Button onClick={() => { setEditingAddon(null); setAddonName(""); setAddonPrice("0"); setAddonFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Add-on
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>£{Number(a.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingAddon(a); setAddonName(a.name); setAddonPrice(a.price.toString()); setAddonFormOpen(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: "addon", id: a.id, name: a.name })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Button onClick={() => { setNewCatName(""); setCatFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Category
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const count = menuItems.filter((i: any) => i.category_id === c.id).length;
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{count} items</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Menu Item Form Dialog */}
      <MenuItemForm
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        categories={categories}
        initialData={editingItem}
        loading={createItem.isPending || updateItem.isPending}
        onSubmit={async (data: any) => {
          try {
            if (data.id) {
              await updateItem.mutateAsync(data);
              toast({ title: "Item updated" });
            } else {
              await createItem.mutateAsync(data);
              toast({ title: "Item added" });
            }
            setItemFormOpen(false);
          } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
          }
        }}
      />

      {/* Crust Form */}
      <Dialog open={crustFormOpen} onOpenChange={setCrustFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCrust ? "Edit Crust" : "Add Crust"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingCrust) {
                  await updateCrust.mutateAsync({ id: editingCrust.id, name: crustName, extra_price: parseFloat(crustPrice) || 0 });
                  toast({ title: "Crust updated" });
                } else {
                  await createCrust.mutateAsync({ name: crustName, extra_price: parseFloat(crustPrice) || 0 });
                  toast({ title: "Crust added" });
                }
                setCrustFormOpen(false);
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            }}
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={crustName} onChange={(e) => setCrustName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Extra Price (£)</Label>
              <Input type="number" step="0.01" value={crustPrice} onChange={(e) => setCrustPrice(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">{editingCrust ? "Update" : "Add"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Addon Form */}
      <Dialog open={addonFormOpen} onOpenChange={setAddonFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddon ? "Edit Add-on" : "Add Add-on"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingAddon) {
                  await updateAddon.mutateAsync({ id: editingAddon.id, name: addonName, price: parseFloat(addonPrice) || 0 });
                  toast({ title: "Add-on updated" });
                } else {
                  await createAddon.mutateAsync({ name: addonName, price: parseFloat(addonPrice) || 0 });
                  toast({ title: "Add-on added" });
                }
                setAddonFormOpen(false);
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            }}
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={addonName} onChange={(e) => setAddonName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Price (£)</Label>
              <Input type="number" step="0.01" value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">{editingAddon ? "Update" : "Add"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Form */}
      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
                await createCategory.mutateAsync({ name: newCatName, sort_order: maxOrder + 1 });
                toast({ title: "Category added" });
                setCatFormOpen(false);
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            }}
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Add Category</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
