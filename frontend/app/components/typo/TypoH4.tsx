import { cn } from "~/lib/utils";

interface TypoH4Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function TypoH4({ children, className, ...props }: TypoH4Props) {
  return (
    <h4
      className={cn(
        "text-xl font-semibold leading-snug text-foreground",
        // 20px, SemiBold, line-height: 27.5px
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

