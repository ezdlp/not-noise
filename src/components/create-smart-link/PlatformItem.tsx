import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, RefreshCw } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";

interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  icon: string;
}

interface PlatformItemProps {
  platform: Platform;
  onToggle: (id: string) => void;
  onUrlChange: (id: string, url: string) => void;
  onFetchLink?: (id: string) => Promise<void>;
  isDraggable?: boolean;
  isFetching?: boolean;
}

const PlatformItem = ({ 
  platform, 
  onToggle, 
  onUrlChange, 
  onFetchLink,
  isDraggable = true,
  isFetching = false 
}: PlatformItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: platform.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
  } : undefined;

  return (
    <div 
      ref={isDraggable ? setNodeRef : undefined} 
      style={style} 
      className="bg-white p-4 rounded-lg shadow-sm mb-2 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {isDraggable && (
          <div {...attributes} {...listeners} className="cursor-grab hover:opacity-70">
            <GripVertical className="text-gray-400" />
          </div>
        )}
        <div className="flex items-center gap-3 flex-1">
          <img 
            src={platform.icon} 
            alt={`${platform.name} logo`}
            className="w-8 h-8 object-contain"
          />
          <span className="ml-2 text-sm font-medium">{platform.name}</span>
          <div className="ml-auto flex gap-2">
            {platform.enabled && onFetchLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFetchLink(platform.id)}
                disabled={isFetching || platform.id === "spotify"}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Fetch Link
              </Button>
            )}
            <Button
              variant={platform.enabled ? "default" : "outline"}
              onClick={() => onToggle(platform.id)}
              disabled={platform.id === "spotify"}
              className={`min-w-[100px] group hover:bg-red-500 hover:border-red-500 ${
                platform.enabled ? "" : "hover:bg-primary hover:border-primary"
              }`}
            >
              <span className="group-hover:hidden">
                {platform.enabled ? "Enabled" : "Disabled"}
              </span>
              <span className="hidden group-hover:inline">
                {platform.enabled ? "Disable" : "Enable"}
              </span>
            </Button>
          </div>
        </div>
      </div>
      {platform.enabled && (
        <Input
          value={platform.url}
          onChange={(e) => onUrlChange(platform.id, e.target.value)}
          className="mt-4"
          placeholder={`Enter ${platform.name} URL manually...`}
        />
      )}
    </div>
  );
};

export default PlatformItem;