
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MigrationStats {
  total: number;
  emailsSent: number;
  passwordsReset: number;
  failed: number;
}

interface UserMigrationStatus {
  id: string;
  email: string;
  status: 'pending' | 'email_sent' | 'password_reset' | 'failed';
  reset_email_sent_at: string | null;
  password_reset_at: string | null;
  error_message: string | null;
}

export function UserMigrationStatus() {
  const [stats, setStats] = useState<MigrationStats>({
    total: 0,
    emailsSent: 0,
    passwordsReset: 0,
    failed: 0
  });
  const [users, setUsers] = useState<UserMigrationStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMigrationStatus = async () => {
    try {
      setIsLoading(true);
      const { data: migrationData, error } = await supabase
        .from('user_migration_status')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (migrationData) {
        setUsers(migrationData);
        setStats({
          total: migrationData.length,
          emailsSent: migrationData.filter(u => u.status === 'email_sent').length,
          passwordsReset: migrationData.filter(u => u.status === 'password_reset').length,
          failed: migrationData.filter(u => u.status === 'failed').length,
        });
      }
    } catch (error) {
      console.error('Error fetching migration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrationStatus();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: UserMigrationStatus['status']) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      email_sent: 'bg-blue-100 text-blue-800',
      password_reset: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusStyles[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Emails Sent</h3>
          <p className="text-2xl font-bold">{stats.emailsSent}</p>
          <Progress 
            value={(stats.emailsSent / stats.total) * 100} 
            className="mt-2"
          />
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Passwords Reset</h3>
          <p className="text-2xl font-bold">{stats.passwordsReset}</p>
          <Progress 
            value={(stats.passwordsReset / stats.total) * 100} 
            className="mt-2"
          />
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Failed</h3>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">User Migration Status</h3>
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground">No users found</p>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{user.email}</p>
                        <div className="flex space-x-2">
                          {getStatusBadge(user.status)}
                          {user.error_message && (
                            <span className="text-sm text-red-600">
                              {user.error_message}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.reset_email_sent_at && (
                          <p>Email sent: {format(new Date(user.reset_email_sent_at), 'PPp')}</p>
                        )}
                        {user.password_reset_at && (
                          <p>Password reset: {format(new Date(user.password_reset_at), 'PPp')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
