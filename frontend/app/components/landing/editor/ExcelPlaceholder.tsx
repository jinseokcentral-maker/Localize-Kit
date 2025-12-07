import { Table } from "lucide-react";
import { TypoP } from "~/components/typo";

export function ExcelPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center space-y-2">
        <Table className="w-12 h-12 mx-auto opacity-30" />
        <TypoP className="text-sm">Excel view coming soon</TypoP>
      </div>
    </div>
  );
}

