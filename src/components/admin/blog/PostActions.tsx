import { Button } from "@/components/ui/button";

interface PostActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  isEditing: boolean;
}

export function PostActions({ isSubmitting, onClose, isEditing }: PostActionsProps) {
  console.log("PostActions rendered with props:", { isSubmitting, isEditing });
  
  return (
    <div className="flex justify-end space-x-4">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button 
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Publish")}
      </Button>
    </div>
  );
}