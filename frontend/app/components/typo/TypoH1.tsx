import { cn } from "~/lib/utils";

interface TypoH1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function TypoH1({ children, className, ...props }: TypoH1Props) {
  return (
    <h1
      className={cn(
        "text-4xl font-bold leading-tight tracking-tight text-foreground",
        // 36px, Bold, line-height: 45px, letter-spacing: -0.9px
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

