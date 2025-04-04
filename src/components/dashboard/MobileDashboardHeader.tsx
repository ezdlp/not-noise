
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger
} from '@/components/ui/drawer';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileDashboardHeader() {
  const isMobile = useIsMobile();
  
  // Only render this component on mobile
  if (!isMobile) {
    return null;
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-white flex items-center px-4">
      <div className="flex w-full items-center justify-between">
        {/* Logo */}
        <div className="h-6 flex items-center">
          <img 
            src="/lovable-uploads/56b25c3e-b9f6-40fe-a8db-39be68cb0cdb.png" 
            alt="Soundraiser" 
            className="h-6" 
          />
        </div>
        
        {/* Menu trigger */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]">
            <div className="mt-4 px-1">
              <DashboardSidebar />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
