
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Link2, 
  Lock, 
  Users, 
  Settings,
  LogOut,
  HelpCircle,
  FileAudio
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSmartLinkCreation } from "@/hooks/useSmartLinkCreation";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { DrawerClose } from "@/components/ui/drawer";

export function DashboardSidebar({ inDrawer = false, autoCloseDrawer = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const sectionParam = searchParams.get('section');
  const isMobile = useIsMobile();
  
  // Default section is smart-links
  const [activeSection, setActiveSection] = useState<'smart-links' | 'email-subscribers' | 'promotions'>(
    (sectionParam as any) || 'smart-links'
  );
  
  const { isFeatureEnabled } = useFeatureAccess();
  const { setShowUpgradeModal } = useSmartLinkCreation();
  const { setOpenMobile } = useSidebar();
  
  // Define handleSectionChange function
  const handleSectionChange = (section: 'smart-links' | 'email-subscribers' | 'promotions') => {
    // Check if email-subscribers is restricted and show upgrade modal if needed
    if (section === 'email-subscribers' && !isFeatureEnabled('email_capture')) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Update active section
    setActiveSection(section);
    
    // Update URL and navigate
    const params = new URLSearchParams(location.search);
    params.set('section', section);
    navigate(`/dashboard?${params.toString()}`);
    
    // Close mobile sidebar if on mobile
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return profile;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["sidebar-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { tier: 'free' };

      // Separate queries to avoid join issues
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) return { tier: 'free' };
      
      return {
        ...subscriptionData,
        tier: subscriptionData?.tier || 'free'
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const isPro = subscription?.tier === 'pro';
  
  // User profile utilities
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word?.[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Determine if the current route is a dashboard route for active states
  const isDashboardRoute = location.pathname === '/dashboard';
  const isSettingsRoute = location.pathname === '/dashboard/settings';

  // Helper function to wrap content with DrawerClose if needed
  const wrapWithDrawerClose = (children: React.ReactNode, shouldWrap: boolean) => {
    if (autoCloseDrawer && inDrawer && shouldWrap) {
      return <DrawerClose asChild>{children}</DrawerClose>;
    }
    return children;
  };

  // For mobile inside a drawer, render just the content without the Sidebar wrapper
  if (isMobile && inDrawer) {
    return (
      <div className="flex flex-col h-full py-4 px-2">
        {/* User Profile Section */}
        <div className="px-2 py-2 mb-2">
          <div className="flex items-center gap-2">
            <Avatar 
              className={cn(
                "h-9 w-9 transition-all duration-200 ring-offset-background shadow-sm",
                isPro 
                  ? "ring-2 ring-primary/40" 
                  : ""
              )}
              title={profile?.name || "Your Account"}
            >
              <AvatarFallback 
                className="bg-primary/10 text-primary text-xs font-medium"
                aria-label={`User avatar for ${profile?.name || "User"}`}
              >
                {getInitials(profile?.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate leading-tight">{profile?.name || "Your Account"}</span>
              {isPro ? (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mt-0.5">
                  Pro Plan
                </span>
              ) : (
                <span className="text-xs text-muted-foreground mt-0.5">Free Plan</span>
              )}
            </div>
          </div>
        </div>
        
        <SidebarSeparator className="mb-2" />
        
        {/* Main Navigation Section - Dashboard */}
        <div className="flex-grow px-1">
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-1">
              Dashboard
            </p>
            <div className="flex flex-col gap-1">
              {wrapWithDrawerClose(
                <button 
                  className={cn(
                    "flex items-center px-3 text-sm h-10 rounded-md transition-colors duration-200 relative w-full text-left",
                    isDashboardRoute && activeSection === 'smart-links' 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSectionChange('smart-links')}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  <span>Smart Links</span>
                </button>,
                true
              )}
              
              {wrapWithDrawerClose(
                <button
                  className={cn(
                    "flex items-center px-3 text-sm h-10 min-w-0 w-full overflow-visible rounded-md transition-colors duration-200 relative text-left",
                    isDashboardRoute && activeSection === 'promotions' 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSectionChange('promotions')}
                >
                  <div className="flex items-center w-full">
                    <FileAudio className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Playlist Promotions</span>
                    <Badge variant="outline" className="ml-1 h-5 px-1.5 bg-primary text-white text-[10px] font-semibold flex-shrink-0">
                      NEW
                    </Badge>
                  </div>
                </button>,
                true
              )}
              
              {wrapWithDrawerClose(
                <button
                  className={cn(
                    "flex items-center px-3 text-sm h-10 rounded-md transition-colors duration-200 relative w-full text-left",
                    isDashboardRoute && activeSection === 'email-subscribers' 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-accent/50",
                    !isFeatureEnabled('email_capture') ? "opacity-70" : ""
                  )}
                  onClick={() => handleSectionChange('email-subscribers')}
                  disabled={!isFeatureEnabled('email_capture')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Email Subscribers</span>
                  {!isFeatureEnabled('email_capture') && (
                    <Lock className="ml-1.5 h-3.5 w-3.5 opacity-70" />
                  )}
                </button>,
                true
              )}
            </div>
          </div>
        </div>
       
        {/* Bottom Section - Help, Settings, Logout */}
        <div className="mt-auto px-1">
          <SidebarSeparator className="mb-2" />
          <div className="flex flex-col gap-1">
            {wrapWithDrawerClose(
              <button
                onClick={() => navigate('/help')}
                className="flex items-center px-3 text-sm h-10 rounded-md transition-colors duration-200 hover:bg-accent/50 w-full text-left"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help Center</span>
              </button>,
              true
            )}
            
            {wrapWithDrawerClose(
              <button
                onClick={() => navigate('/dashboard/settings')}
                className={cn(
                  "flex items-center px-3 text-sm h-10 rounded-md transition-colors duration-200 w-full text-left",
                  isSettingsRoute ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </button>,
              true
            )}
            
            {wrapWithDrawerClose(
              <button
                onClick={handleLogout}
                className="flex items-center px-3 text-sm h-10 rounded-md transition-colors duration-200 hover:bg-accent/50 w-full text-left"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </button>,
              true
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular desktop or non-drawer mobile version
  return (
    <Sidebar 
      variant={isMobile ? "floating" : "sidebar"} 
      className={cn(
        "w-64 z-10 transition-all duration-300",
        isMobile && "w-full shadow-none border-none"
      )}
    >
      {!isMobile && (
        <SidebarHeader className="px-4 py-3 flex items-center justify-between border-b">
          <div className="h-6 flex items-center">
            <Link to="/" className="transition-opacity duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
              <img 
                src="/lovable-uploads/56b25c3e-b9f6-40fe-a8db-39be68cb0cdb.png" 
                alt="Soundraiser" 
                className="h-6 transition-transform duration-300" 
              />
            </Link>
          </div>
        </SidebarHeader>
      )}
      
      <SidebarContent className="py-5 px-2 flex flex-col h-[calc(100%-3.5rem)]">
        {/* User Profile Section */}
        <div className="px-2 py-2 mb-4">
          <div className="flex items-center gap-2">
            <Avatar 
              className={cn(
                "h-9 w-9 transition-all duration-200 ring-offset-background shadow-sm",
                isPro 
                  ? "ring-2 ring-primary/40" 
                  : ""
              )}
              title={profile?.name || "Your Account"}
            >
              <AvatarFallback 
                className="bg-primary/10 text-primary text-xs font-medium"
                aria-label={`User avatar for ${profile?.name || "User"}`}
              >
                {getInitials(profile?.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate leading-tight">{profile?.name || "Your Account"}</span>
              {isPro ? (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mt-0.5">
                  Pro Plan
                </span>
              ) : (
                <span className="text-xs text-muted-foreground mt-0.5">Free Plan</span>
              )}
            </div>
          </div>
        </div>
        
        <SidebarSeparator className="mb-2" />
        
        {/* Main Navigation Section - Dashboard */}
        <div className="flex-grow px-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-1">
              Dashboard
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isDashboardRoute && activeSection === 'smart-links'}
                  onClick={() => handleSectionChange('smart-links')}
                  tooltip="Smart Links"
                  className="transition-colors duration-200 relative px-3 text-sm h-10"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  <span>Smart Links</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isDashboardRoute && activeSection === 'promotions'}
                  onClick={() => handleSectionChange('promotions')}
                  tooltip="Playlist Promotions"
                  className="transition-colors duration-200 relative px-3 text-sm h-10 min-w-0 w-full overflow-visible"
                >
                  <div className="flex items-center w-full">
                    <FileAudio className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Playlist Promotions</span>
                    <Badge variant="outline" className="ml-1 h-5 px-1.5 bg-primary text-white text-[10px] font-semibold flex-shrink-0">
                      NEW
                    </Badge>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isDashboardRoute && activeSection === 'email-subscribers'}
                  onClick={() => handleSectionChange('email-subscribers')}
                  disabled={!isFeatureEnabled('email_capture')}
                  tooltip="Email Subscribers"
                  className="transition-colors duration-200 relative px-3 text-sm h-10"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Email Subscribers</span>
                  {!isFeatureEnabled('email_capture') && (
                    <Lock className="ml-1.5 h-3.5 w-3.5 opacity-70" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </div>
       
        {/* Bottom Section - Help, Settings, Logout */}
        <div className="mt-auto px-1">
          <SidebarSeparator className="mb-2" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/help')}
                tooltip="Help Center"
                className="transition-colors duration-200 relative px-3 text-sm h-10"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help Center</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isSettingsRoute}
                onClick={() => navigate('/dashboard/settings')}
                tooltip="Settings"
                className="transition-colors duration-200 relative px-3 text-sm h-10"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Log out"
                className="transition-colors duration-200 relative px-3 text-sm h-10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
