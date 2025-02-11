
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { User, Settings, LogOut } from "lucide-react"
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserMenuContentProps {
  profile: any;
  subscription: any;
}

export function UserMenuContent({ profile, subscription }: UserMenuContentProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  return (
    <DropdownMenuContent 
      className="w-56 animate-scale-in" 
      align="end"
      aria-label="User menu"
    >
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-row items-center space-x-3">
          <Avatar 
            className={`h-7 w-7 transition-all duration-200 ring-offset-background
              ${subscription?.tier === "pro" ? "ring-2 ring-primary hover:ring-primary/90" : "hover:ring-2 hover:ring-neutral-200"}`}
          >
            <AvatarFallback 
              className="bg-primary/5 text-primary text-xs font-medium"
              aria-label={`User avatar for ${profile?.name || "User"}`}
            >
              {getInitials(profile?.name || "User")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.name || "Your Account"}</p>
            {subscription?.tier === "pro" ? (
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                  Pro Plan
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Free Plan</p>
            )}
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem 
          onClick={() => navigate("/dashboard")}
          className="focus:bg-neutral-50 cursor-pointer transition-colors text-sm"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/settings")}
          className="focus:bg-neutral-50 cursor-pointer transition-colors text-sm"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        onClick={handleLogout}
        className="focus:bg-neutral-50 cursor-pointer transition-colors text-sm text-red-600 focus:text-red-600"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

