import { cn } from "~/lib/utils";

interface TypoH5Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function TypoH5({ children, className, ...props }: TypoH5Props) {
  return (
    <h5
      className={cn(
        "text-lg font-medium leading-normal text-foreground",
        // 18px, Medium, line-height: 27px
        className
      )}
      {...props}
    >
      {children}
    </h5>
  );
}

