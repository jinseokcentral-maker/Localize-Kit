import { cn } from "~/lib/utils";

interface TypoCodeProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  block?: boolean;
}

export function TypoCode({ children, className, block = false, ...props }: TypoCodeProps) {
  if (block) {
    return (
      <pre
        className={cn(
          "font-mono text-sm leading-normal text-foreground",
          "bg-muted rounded-md p-4 overflow-x-auto",
          className
        )}
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  }

  return (
    <code
      className={cn(
        "font-mono text-sm leading-normal text-foreground",
        // 14px, JetBrains Mono / Geist Mono
        "bg-muted rounded px-1.5 py-0.5",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

