import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const tagVariants = cva(
  "group/tag inline-flex shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md font-medium whitespace-nowrap [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-background text-primary",
        secondary: "bg-secondary-background text-secondary",
        tertiary: "bg-tertiary-background text-tertiary",
        neutral: "bg-neutral-background text-neutral",
      },
      size: {
        default: "h-5 px-2 py-1 text-sm [&>svg]:size-3!",
        sm: " px-2 py-1 text-xs leading-none [&>svg]:size-2.5!",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface TagProps extends React.ComponentProps<"span">, VariantProps<typeof tagVariants> {
  asChild?: boolean;
}

function Tag({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: TagProps) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="tag"
      data-variant={variant}
      data-size={size}
      className={cn(tagVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Tag, tagVariants };
