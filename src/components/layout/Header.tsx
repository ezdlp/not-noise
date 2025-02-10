
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CTAButton } from "@/components/ui/cta-button"
import { User, LogIn, Menu, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NavigationItems } from "@/components/navigation/NavigationItems"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserMenuContent } from "@/components/navigation/UserMenuContent"
import { cn } from "@/lib/utils"

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

  const MarketingNavLinks = () => (
    <div className="hidden md:flex md:space-x-4">
      <NavigationItems />
    </div>
  )

  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-md">
        <nav className="flex flex-col gap-4">
          {!isDashboard && (
            <div className="flex flex-col gap-4 py-4">
              {!isAuthenticated ? (
                <>
                  <CTAButton onClick={() => navigate("/register")} className="w-full">
                    Get Started
                  </CTAButton>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="w-full gap-2 font-medium text-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Button>
                </>
              ) : (
                <>
                  <CTAButton onClick={() => navigate("/create")} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create Smart Link
                  </CTAButton>
                  <div className="flex flex-col gap-2">
                    <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/settings" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                      Settings
                    </Link>
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="text-sm font-medium text-gray-600 hover:text-primary transition-colors text-left"
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
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-200",
      isDashboard ? "border-neutral-border bg-white/95" : "border-gray-100 bg-white/90"
    )}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/56b25c3e-b9f6-40fe-a8db-39be68cb0cdb.png" 
              alt="Soundraiser" 
              className="h-7 md:h-9"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        {!isDashboard && <MarketingNavLinks />}

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="hidden md:flex gap-2 font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
              <CTAButton 
                onClick={() => navigate("/register")}
                className="hidden md:flex py-2 px-4 text-sm font-medium transition-all hover:opacity-90"
              >
                Get Started
              </CTAButton>
            </>
          ) : (
            <>
              {!isDashboard && (
                <Button
                  onClick={() => navigate("/create")}
                  className="hidden md:flex gap-2 bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Smart Link
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="User menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <UserMenuContent />
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
