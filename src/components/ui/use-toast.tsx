
import { useToast as useToastOriginal } from "@/components/ui/toast"

// Re-export useToast with the same API
export const useToast = useToastOriginal;

// Also export toast function for direct usage
export const toast = useToastOriginal().toast;
