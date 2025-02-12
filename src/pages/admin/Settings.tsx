import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings as SettingsIcon, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);

  // Query the user's profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return profileData;
    },
  });

  // Query the user's subscription
  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: subscriptionData, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return subscriptionData;
    },
  });

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const updates = {
      name: String(formData.get('name')),
      artist_name: String(formData.get('artist_name')),
      music_genre: String(formData.get('music_genre')),
      country: String(formData.get('country')),
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('new_password') as string;

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      toast.success("Password updated successfully");
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast.error("Account deletion is not implemented yet");
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId: subscription?.price_id,
          isSubscription: true
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No portal URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast.error("Failed to open subscription management portal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandingToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hide_branding: checked })
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success("Branding preference updated");
    } catch (error) {
      console.error('Error updating branding preference:', error);
      toast.error("Failed to update branding preference");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkeletonForm = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="inline-flex h-auto p-1 bg-muted text-muted-foreground rounded-lg w-full sm:w-auto">
          <TabsTrigger value="profile" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground">
            <SettingsIcon className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="p-6">
            {isProfileLoading ? (
              renderSkeletonForm()
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    defaultValue={profile?.name || ''}
                    placeholder="Your full name" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="artist_name">Artist Name</Label>
                  <Input 
                    id="artist_name" 
                    name="artist_name"
                    defaultValue={profile?.artist_name || ''}
                    placeholder="Your artist name" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="music_genre">Music Genre</Label>
                  <Select name="music_genre" defaultValue={profile?.music_genre || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="hip-hop">Hip Hop</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select name="country" defaultValue={profile?.country || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  value={profile?.email || ''} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Your email address is managed through your authentication provider.
                </p>
              </div>

              {subscription?.tier === 'pro' && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Smart Link Branding</Label>
                      <p className="text-sm text-muted-foreground">
                        Hide the "Powered by Soundraiser" attribution on your smart links
                      </p>
                    </div>
                    <Switch
                      checked={profile?.hide_branding || false}
                      onCheckedChange={handleBrandingToggle}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input 
                    id="new_password"
                    name="new_password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Change Password"}
                </Button>
              </form>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="p-6">
            {isSubscriptionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Plan</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="mb-4 sm:mb-0">
                      <p className="font-medium text-lg">
                        {subscription?.tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                      </p>
                      {subscription?.tier === 'pro' && (
                        <p className="text-sm text-muted-foreground">
                          {subscription?.billing_period === 'monthly' ? 'Monthly' : 'Annual'} billing
                        </p>
                      )}
                    </div>
                    {subscription?.tier === 'pro' && (
                      <Button 
                        variant="outline" 
                        onClick={handleManageSubscription}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        {isLoading ? "Loading..." : "Manage Subscription"}
                      </Button>
                    )}
                  </div>
                </div>

                {subscription?.tier === 'free' && (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro to unlock all features and remove limits.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/pricing'}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
