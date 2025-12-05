import { cn } from "~/lib/utils";

interface TypoH2Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function TypoH2({ children, className, ...props }: TypoH2Props) {
  return (
    <h2
      className={cn(
        "text-3xl font-semibold leading-tight tracking-tight text-foreground",
        // 30px, SemiBold, line-height: 37.5px, letter-spacing: -0.75px
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

