import { cn } from "~/lib/utils";

interface TypoH6Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function TypoH6({ children, className, ...props }: TypoH6Props) {
  return (
    <h6
      className={cn(
        "text-base font-medium leading-normal text-foreground",
        // 16px, Medium, line-height: 24px
        className
      )}
      {...props}
    >
      {children}
    </h6>
  );
}

