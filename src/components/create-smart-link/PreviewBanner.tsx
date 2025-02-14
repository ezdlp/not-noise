
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function PreviewBanner() {
  const navigate = useNavigate();

  return (
    <div className="bg-primary/5 border-b border-primary/10 p-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          You're in preview mode. Create an account to publish and share your smart links.
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>
          <Button 
            onClick={() => navigate("/register")}
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
}
