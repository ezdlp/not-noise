import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CTAButton } from "@/components/ui/cta-button";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/lovable-uploads/d104a2a7-bcdb-4c86-9761-3528acceee41.png" alt="notnoise" className="h-8" />
        </Link>

        <nav className="flex-1 flex justify-center">
          <ul className="flex space-x-10">
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
        </nav>

        <div className="flex items-center space-x-6">
          <CTAButton 
            onClick={() => navigate("/register")}
            className="!py-2 !px-4 !text-sm"
          >
            GET STARTED
          </CTAButton>

          {isAuthenticated && (
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
                  <Link to="/profile" className="w-full cursor-pointer hover:bg-gray-50">
                    Profile
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
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;