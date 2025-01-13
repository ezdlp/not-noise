import { Progress } from "@/components/ui/progress";

interface PlatformsLoadingProps {
  progress: number;
}

export const PlatformsLoading = ({ progress }: PlatformsLoadingProps) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Fetching streaming links...</p>
      <Progress value={progress} className="w-full" />
    </div>
  );
};