import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CTAButton } from "@/components/ui/cta-button";
import { User, LogIn, Menu, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const MarketingNavLinks = () => (
    <ul className="flex flex-col md:flex-row md:space-x-10 space-y-4 md:space-y-0">
      <li>
        <Link 
          to="/pricing" 
          className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200 font-poppins"
        >
          Pricing
        </Link>
      </li>
      <li>
        <Link 
          to="/blog" 
          className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200 font-poppins"
        >
          Blog
        </Link>
      </li>
      <li>
        <Link 
          to="/help" 
          className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200 font-poppins"
        >
          Help
        </Link>
      </li>
    </ul>
  );

  const headerClasses = isDashboard 
    ? "border-b border-neutral-border bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50" 
    : "border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50";

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/soundraiser-logo/Logo A low.png" 
            alt="Soundraiser" 
            className="h-6 md:h-8"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center">
          {!isDashboard && <MarketingNavLinks />}
        </nav>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <CTAButton 
                onClick={() => navigate("/register")}
                className="hidden md:flex !py-2 !px-4 !text-sm"
              >
                Get Started
              </CTAButton>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="hidden md:flex"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login
              </Button>
            </>
          ) : (
            <>
              {!isDashboard && (
                <CTAButton 
                  onClick={() => navigate("/create")}
                  className="hidden md:flex !py-2 !px-4 !text-sm"
                >
                  Create Smart Link
                </CTAButton>
              )}

              {isDashboard && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/help")}
                  size="icon"
                  className="text-gray-600 hover:bg-transparent"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:bg-transparent"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="w-full cursor-pointer hover:bg-gray-50">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="w-full cursor-pointer hover:bg-gray-50">
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-gray-50">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 py-4">
                {!isDashboard && <MarketingNavLinks />}
                {!isAuthenticated ? (
                  <div className="flex flex-col gap-4">
                    <CTAButton onClick={() => navigate("/register")}>
                      Get Started
                    </CTAButton>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="w-full"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Login
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {!isDashboard && (
                      <CTAButton onClick={() => navigate("/create")}>
                        Create Smart Link
                      </CTAButton>
                    )}
                    <div className="flex flex-col gap-2">
                      <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary">
                        Dashboard
                      </Link>
                      <Link to="/settings" className="text-sm font-medium text-gray-600 hover:text-primary">
                        Account Settings
                      </Link>
                      <Link to="/help" className="text-sm font-medium text-gray-600 hover:text-primary">
                        Help
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-gray-600 hover:text-primary text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
