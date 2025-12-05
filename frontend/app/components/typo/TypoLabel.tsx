import { cn } from "~/lib/utils";

interface TypoLabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  htmlFor?: string;
}

export function TypoLabel({ children, className, htmlFor, ...props }: TypoLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium leading-none text-foreground",
        // 14px, Medium - for form labels
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

