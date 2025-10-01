import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';

interface TestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestSheet({ open, onOpenChange }: TestSheetProps) {
  console.log('TestSheet render - open:', open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Teste do Sheet</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <p>Se você está vendo isso, o Sheet funciona!</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}