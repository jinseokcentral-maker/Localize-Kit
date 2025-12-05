import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

/**
 * LocalizeKit Button Component
 *
 * Variants based on Figma design:
 * - default (primary): Blue background (#3981f6), white text
 * - outline: Transparent bg, neutral-700 border, light text
 * - ghost: neutral-800 bg, neutral-700 border, light text
 * - secondary: neutral-800 bg, no border
 * - destructive: Red background, white text
 * - link: No background, underline on hover
 *
 * Sizes based on Figma:
 * - sm: h-8 (32px) - small buttons like tabs
 * - default: h-9 (36px) - standard buttons
 * - md: h-10 (40px) - Login, navigation buttons
 * - lg: h-12 (48px) - hero CTA buttons
 */
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-normal transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        // Primary: Blue background, white text (Figma #3981f6)
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80",

        // Destructive: Red background
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80",

        // Outline: Border only, transparent background
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary/50 active:bg-secondary/70",

        // Secondary: Dark background, no border
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/60",

        // Ghost: Dark background with border (like Copy, Download buttons)
        ghost:
          "bg-secondary border border-border text-foreground hover:bg-secondary/80 active:bg-secondary/60",

        // Link: No background, underline
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Small: 32px height (tabs, small actions)
        sm: "h-8 px-3 text-sm rounded-md",

        // Default: 36px height (standard buttons)
        default: "h-9 px-4 text-sm rounded-md",

        // Medium: 40px height (Login, navigation)
        md: "h-10 px-5 text-base rounded-md",

        // Large: 48px height (hero CTAs)
        lg: "h-12 px-6 text-base rounded-md",

        // Icon sizes
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-md": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
