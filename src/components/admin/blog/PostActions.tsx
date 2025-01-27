import { Button } from "@/components/ui/button";

interface PostActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  isEditing: boolean;
}

export function PostActions({ isSubmitting, onClose, isEditing }: PostActionsProps) {
  return (
    <div className="flex justify-end space-x-4 mb-6 sticky top-0 bg-background z-10 py-4 border-b">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Publish")}
      </Button>
    </div>
  );
}