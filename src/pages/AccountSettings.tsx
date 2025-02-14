import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, User, CreditCard, CheckCircle, X, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { countries } from "@/lib/countries";
import { genres } from "@/lib/genres";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

export default function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    artist_name: "",
    music_genre: "",
    country: "",
    hide_branding: false,
  });
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setEmail(session.user.email || "");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      toast({
        title: "Error loading profile",
        description: profileError.message,
        variant: "destructive",
      });
      return;
    }

    if (profileData) {
      setProfile({
        name: profileData.name,
        artist_name: profileData.artist_name,
        music_genre: profileData.music_genre,
        country: profileData.country,
        hide_branding: profileData.hide_branding || false,
      });
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        artist_name: profile.artist_name,
        music_genre: profile.music_genre,
        country: profile.country,
        hide_branding: profile.hide_branding,
      })
      .eq("id", session.user.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }
    setLoading(false);
  };

  const updateEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      toast({
        title: "Error updating email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email update initiated",
        description: "Please check your new email for confirmation.",
      });
    }
    setLoading(false);
  };

  const checkPasswordRequirements = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
    setPasswordRequirements(requirements);

    let strength = 0;
    if (requirements.minLength) strength += 25;
    if (requirements.hasUppercase) strength += 25;
    if (requirements.hasLowercase) strength += 25;
    if (requirements.hasNumber) strength += 25;
    setPasswordStrength(strength);

    return requirements;
  };

  const updatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 75) {
      toast({
        title: "Weak password",
        description: "Please ensure your password meets all the requirements.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    setUpdateSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwords.new 
      });

      if (error) throw error;

      setUpdateSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      
      setPasswords({ current: "", new: "", confirm: "" });
      setPasswordStrength(0);
      setPasswordRequirements({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
      });
      
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Invalid confirmation",
        description: 'Please type "DELETE" to confirm account deletion.',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      navigate("/");
    }
    setLoading(false);
  };

  const handleBrandingToggle = async (checked: boolean) => {
    setProfile(prev => ({ ...prev, hide_branding: checked }));
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ hide_branding: checked })
      .eq("id", session.user.id);

    if (error) {
      toast({
        title: "Error updating branding settings",
        description: error.message,
        variant: "destructive",
      });
      // Revert the toggle if there was an error
      setProfile(prev => ({ ...prev, hide_branding: !checked }));
    } else {
      toast({
        title: "Branding settings updated",
        description: checked ? "Branding has been hidden from your smart links." : "Branding is now visible on your smart links.",
      });
    }
  };

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-link', {
        body: { return_url: `${window.location.origin}/account` },
      });

      if (error) throw error;
      window.location.assign(data.url);
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and subscription</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist_name">Artist Name</Label>
                  <Input
                    id="artist_name"
                    value={profile.artist_name}
                    onChange={(e) => setProfile({ ...profile, artist_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="music_genre">Music Genre</Label>
                  <Select
                    value={profile.music_genre}
                    onValueChange={(value) => setProfile({ ...profile, music_genre: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={profile.country}
                    onValueChange={(value) => setProfile({ ...profile, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={updateProfile} disabled={loading} className="w-full md:w-auto">
                {loading ? "Saving..." : "Save Profile Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>Update your email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={updateEmail} disabled={loading} className="w-full md:w-auto">
                {loading ? "Updating..." : "Update Email"}
              </Button>
            </CardContent>
          </Card>

          {subscription?.tier === 'pro' && (
            <Card>
              <CardHeader>
                <CardTitle>Smart Link Branding</CardTitle>
                <CardDescription>Control the visibility of Soundraiser branding on your smart links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="branding-toggle">Hide Soundraiser branding</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove "Powered by Soundraiser" from your smart links
                    </p>
                  </div>
                  <Switch
                    id="branding-toggle"
                    checked={profile.hide_branding}
                    onCheckedChange={handleBrandingToggle}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {updateSuccess && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 text-primary rounded-lg mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span>Password successfully updated</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => {
                        setPasswords({ ...passwords, new: e.target.value });
                        checkPasswordRequirements(e.target.value);
                      }}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <Progress 
                    value={passwordStrength} 
                    className="h-1" 
                    style={{
                      backgroundColor: '#ECE9FF',
                      '--progress-background': '#6851FB'
                    } as React.CSSProperties}
                  />
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    {[
                      { key: 'minLength', label: 'At least 8 characters' },
                      { key: 'hasUppercase', label: 'One uppercase letter' },
                      { key: 'hasLowercase', label: 'One lowercase letter' },
                      { key: 'hasNumber', label: 'One number' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 ${
                          passwordRequirements[key as keyof typeof passwordRequirements]
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {passwordRequirements[key as keyof typeof passwordRequirements] ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                onClick={updatePassword} 
                disabled={updating || !passwords.current || !passwords.new || !passwords.confirm}
                className="w-full md:w-auto"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all of your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 py-4">
                    <Label htmlFor="delete-confirmation">
                      Type "DELETE" to confirm
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAccount}
                      disabled={deleteConfirmation !== "DELETE" || loading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>Manage your subscription and payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Current Plan</h4>
                  <p className="text-2xl font-bold">
                    {subscription?.tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                  {subscription?.tier === 'pro' ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {subscription.billing_period === 'monthly' ? 'Monthly' : 'Annual'} billing
                      </p>
                      {subscription.current_period_end && (
                        <p className="text-sm text-muted-foreground">
                          Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro to unlock all features and create unlimited smart links
                    </p>
                  )}
                </div>
              </div>
              {subscription?.tier === 'pro' ? (
                <Button 
                  className="w-full md:w-auto"
                  onClick={handleManageSubscription}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Manage Subscription"}
                </Button>
              ) : (
                <Button 
                  className="w-full md:w-auto"
                  onClick={() => navigate("/pricing")}
                >
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
