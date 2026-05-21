import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type GoogleMapsAttributionProps = ComponentProps<"p">;

function GoogleLogoWordmark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-baseline font-sans text-[13px] leading-none font-semibold"
    >
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#DB4437]">o</span>
      <span className="text-[#F4B400]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#0F9D58]">l</span>
      <span className="text-[#DB4437]">e</span>
    </span>
  );
}

export function GoogleMapsAttribution({ className, ...props }: GoogleMapsAttributionProps) {
  return (
    <p
      className={cn(
        "inline-flex w-fit items-baseline gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] leading-none font-medium text-slate-400",
        className
      )}
      {...props}
    >
      <span>Powered by</span>
      <span className="sr-only">Google Maps</span>
      <GoogleLogoWordmark />
    </p>
  );
}
