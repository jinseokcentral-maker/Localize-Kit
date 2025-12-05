import { cn } from "~/lib/utils";

interface TypoPProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  muted?: boolean;
}

export function TypoP({ children, className, muted = false, ...props }: TypoPProps) {
  return (
    <p
      className={cn(
        "text-base font-normal leading-relaxed",
        // 16px, Normal, line-height: 26px
        muted ? "text-muted-foreground" : "text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

