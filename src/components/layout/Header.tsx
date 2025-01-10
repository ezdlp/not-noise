import { Link } from "react-router-dom";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center">
            <img src="/lovable-uploads/c5ed8af4-4aa7-493b-aadf-0a234581bbbf.png" alt="Soundraiser" className="h-8" />
          </Link>

          <NavigationMenu>
            <NavigationMenuList className="space-x-8">
              <NavigationMenuItem>
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Smart Links
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link 
                  to="/spotify-promotion" 
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Spotify Playlist Promotion
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link 
                  to="/blog" 
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Blog
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link 
                  to="/help" 
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Help
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-gray-600 hover:text-primary hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="w-full cursor-pointer">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="w-full cursor-pointer">
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;