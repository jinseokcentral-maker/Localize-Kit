import { Button } from "~/components/ui/button";
import { TypoP } from "~/components/typo";
import { cn } from "~/lib/utils";

interface ProBannerProps {
  className?: string;
}

export function ProBanner({ className }: ProBannerProps) {
  return (
    <div
      className={cn(
        "bg-muted/50 border-b border-border px-6 py-3 flex items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3 text-foreground">
        <span className="text-xl">💡</span>
        <TypoP className="text-sm sm:text-base text-muted-foreground">
          Need to save projects and deliver via API?{" "}
          <span className="text-foreground font-medium">Get LocalizeKit Pro</span>
        </TypoP>
      </div>
      <Button size="sm" className="whitespace-nowrap">
        Get Started Free →
      </Button>
    </div>
  );
}

