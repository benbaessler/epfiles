import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default:
    "border-transparent bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
  citation:
    "border-transparent bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors font-mono text-xs tracking-wide border border-primary/20 shadow-[0_0_10px_-5px_var(--color-primary)]",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

