import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface DetailSheetProps {
  trigger: ReactNode;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

/** Shared bottom-sheet wrapper for tapping a summary card to see it in more depth. */
export function DetailSheet({ trigger, title, icon: Icon, children }: DetailSheetProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="bg-background border-none max-h-[85vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60">
            <Icon className="w-4 h-4" />
            {title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-10 overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
