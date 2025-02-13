
import { SendPasswordResetEmails } from "@/components/admin/users/SendPasswordResetEmails";
import { UserMigrationStatus } from "@/components/admin/users/UserMigrationStatus";

export default function UserMigrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Migration</h2>
        <p className="text-muted-foreground">
          Manage and track the progress of user password resets
        </p>
      </div>
      
      <SendPasswordResetEmails />
      <UserMigrationStatus />
    </div>
  );
}
