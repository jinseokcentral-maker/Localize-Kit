import { cn } from "~/lib/utils";

interface TypoSmallProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  muted?: boolean;
}

export function TypoSmall({ children, className, muted = false, ...props }: TypoSmallProps) {
  return (
    <small
      className={cn(
        "text-sm font-normal leading-normal",
        // 14px, Normal, line-height: 21px
        muted ? "text-muted-foreground" : "text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </small>
  );
}

