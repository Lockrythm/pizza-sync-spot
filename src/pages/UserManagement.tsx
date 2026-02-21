import { Users } from "lucide-react";

export default function UserManagement() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <Users className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">User Management</h2>
      <p>Admin user management coming soon</p>
    </div>
  );
}
