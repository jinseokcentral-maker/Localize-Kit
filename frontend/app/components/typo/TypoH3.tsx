import { cn } from "~/lib/utils";

interface TypoH3Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function TypoH3({ children, className, ...props }: TypoH3Props) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-snug text-foreground",
        // 24px, SemiBold, line-height: 33px
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

