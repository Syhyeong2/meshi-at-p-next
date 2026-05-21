import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const tagVariants = cva(
  "group/tag inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        primary: "bg-primary-background text-primary",
        secondary: "bg-secondary-background text-secondary",
        tertiary: "bg-tertiary-background text-tertiary",
        neutral: "bg-neutral-background text-neutral",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface TagProps extends React.ComponentProps<"span">, VariantProps<typeof tagVariants> {
  asChild?: boolean;
}

function Tag({ className, variant = "primary", asChild = false, ...props }: TagProps) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="tag"
      data-variant={variant}
      className={cn(tagVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Tag, tagVariants };
