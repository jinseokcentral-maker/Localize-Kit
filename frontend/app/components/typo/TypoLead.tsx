import { cn } from "~/lib/utils";

interface TypoLeadProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function TypoLead({ children, className, ...props }: TypoLeadProps) {
  return (
    <p
      className={cn(
        "text-xl font-normal leading-relaxed text-muted-foreground",
        // 20px, Normal - for intro/lead paragraphs
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

