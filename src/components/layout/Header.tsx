
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CTAButton } from "@/components/ui/cta-button"
import { Menu } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NavigationItems } from "@/components/navigation/NavigationItems"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserMenuContent } from "@/components/navigation/UserMenuContent"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const isDashboard = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      return profile
    },
  })

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()

      return data
    },
  })

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const MarketingNavLinks = () => (
    <div className="hidden md:flex md:space-x-2">
      <NavigationItems />
    </div>
  )

  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden hover:bg-neutral-50 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[300px] sm:w-[380px] bg-white/95 backdrop-blur-md border-neutral-200"
      >
        <nav className="flex flex-col gap-3">
          {!isDashboard && (
            <div className="flex flex-col gap-3 py-4">
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="default"
                    onClick={() => navigate("/register")}
                    className="w-full h-8 text-sm bg-primary hover:bg-primary/90 transition-colors"
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="w-full h-8 text-sm hover:bg-neutral-50 transition-colors font-medium"
                  >
                    Log In
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate("/create")} 
                    className="w-full h-8 text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Create Smart Link
                  </Button>
                  <div className="flex flex-col gap-1.5">
                    <Link 
                      to="/dashboard" 
                      className="text-sm font-medium text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-md hover:bg-neutral-50"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/settings" 
                      className="text-sm font-medium text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-md hover:bg-neutral-50"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors px-2 py-1.5 rounded-md hover:bg-neutral-50 text-left"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-200 h-16",
        isDashboard 
          ? "border-neutral-border bg-white/95" 
          : "border-neutral-200 bg-white/90"
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/56b25c3e-b9f6-40fe-a8db-39be68cb0cdb.png" 
              alt="Soundraiser" 
              className="h-6 md:h-7"
            />
          </Link>
        </div>

        {!isDashboard && <MarketingNavLinks />}

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="hidden md:flex h-8 text-sm hover:bg-neutral-50 transition-colors font-medium border border-neutral-200"
              >
                Log In
              </Button>
              <Button 
                onClick={() => navigate("/register")}
                className="hidden md:flex h-8 px-3 text-sm font-medium bg-primary hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </Button>
            </>
          ) : (
            <>
              {!isDashboard && (
                <Button
                  onClick={() => navigate("/create")}
                  className="hidden md:flex h-8 px-3 text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Create Smart Link
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full hover:bg-neutral-50 transition-colors p-0"
                    aria-label="User menu"
                  >
                    <Avatar 
                      className={cn(
                        "h-7 w-7 transition-all duration-200 ring-offset-background",
                        subscription?.tier === "pro" 
                          ? "ring-2 ring-primary/30 hover:ring-primary/40" 
                          : "hover:ring-2 hover:ring-neutral-200"
                      )}
                    >
                      <AvatarFallback 
                        className="bg-primary/5 text-primary text-xs font-medium"
                        aria-label={`User avatar for ${profile?.name || "User"}`}
                      >
                        {getInitials(profile?.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <UserMenuContent profile={profile} subscription={subscription} />
              </DropdownMenu>
            </>
          )}

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

export default Header

