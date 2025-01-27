import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CTAButton } from "@/components/ui/cta-button";
import { User, LogIn, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const NavLinks = () => (
    <ul className="flex flex-col md:flex-row md:space-x-10 space-y-4 md:space-y-0">
      <li>
        <Link 
          to="/pricing" 
          className="text-sm font-medium text-onyx hover:text-accent relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-accent after:left-0 after:bottom-0 after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 font-heading"
        >
          Pricing
        </Link>
      </li>
      <li>
        <Link 
          to="/blog" 
          className="text-sm font-medium text-onyx hover:text-accent relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-accent after:left-0 after:bottom-0 after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 font-heading"
        >
          Blog
        </Link>
      </li>
      <li>
        <Link 
          to="/help" 
          className="text-sm font-medium text-onyx hover:text-accent relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-accent after:left-0 after:bottom-0 after:origin-center after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 font-heading"
        >
          Help
        </Link>
      </li>
    </ul>
  );

  return (
    <header className="border-b border-neutral bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/soundraiser-logo/Logo A low.png" 
            alt="Soundraiser" 
            className="h-6 md:h-8 hover:opacity-80 transition-opacity"
          />
        </Link>

        <nav className="hidden md:flex flex-1 justify-center">
          <NavLinks />
        </nav>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <CTAButton 
                onClick={() => navigate("/register")}
                className="hidden md:flex !py-2 !px-4 !text-sm font-heading hover:animate-glitch bg-secondary hover:bg-secondary/90"
              >
                GET STARTED
              </CTAButton>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="hidden md:flex text-onyx hover:text-secondary"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login
              </Button>
            </>
          ) : (
            <>
              <CTAButton 
                onClick={() => navigate("/create")}
                className="hidden md:flex !py-2 !px-4 !text-sm font-heading hover:animate-glitch bg-secondary hover:bg-secondary/90"
              >
                CREATE SMART LINK
              </CTAButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-onyx hover:text-secondary"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="w-full cursor-pointer hover:bg-neutral">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer hover:bg-neutral">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="w-full cursor-pointer hover:bg-neutral">
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-neutral">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-secondary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-neutral">
              <div className="flex flex-col gap-6 py-4">
                <NavLinks />
                {!isAuthenticated ? (
                  <div className="flex flex-col gap-4">
                    <CTAButton onClick={() => navigate("/register")} className="font-heading hover:animate-glitch bg-secondary hover:bg-secondary/90">
                      GET STARTED
                    </CTAButton>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="w-full text-onyx hover:text-secondary"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Login
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <CTAButton onClick={() => navigate("/create")} className="font-heading hover:animate-glitch bg-secondary hover:bg-secondary/90">
                      CREATE SMART LINK
                    </CTAButton>
                    <div className="flex flex-col gap-2">
                      <Link to="/dashboard" className="text-sm font-medium text-onyx hover:text-secondary">
                        Dashboard
                      </Link>
                      <Link to="/profile" className="text-sm font-medium text-onyx hover:text-secondary">
                        Profile
                      </Link>
                      <Link to="/settings" className="text-sm font-medium text-onyx hover:text-secondary">
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-onyx hover:text-secondary text-left"
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