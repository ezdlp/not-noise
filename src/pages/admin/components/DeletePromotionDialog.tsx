
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface DeletePromotionDialogProps {
  promotionId: string;
  promotionName: string;
  onSuccess: () => void;
}

export const DeletePromotionDialog: React.FC<DeletePromotionDialogProps> = ({
  promotionId,
  promotionName,
  onSuccess
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const handleDelete = async () => {
    if (!promotionId) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the promotion from the database
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", promotionId);
      
      if (error) throw error;
      
      toast({
        title: "Promotion deleted",
        description: `Promotion "${promotionName}" has been permanently deleted`,
      });
      
      onSuccess();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error deleting promotion:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the promotion",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the promotion <strong>"{promotionName}"</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
