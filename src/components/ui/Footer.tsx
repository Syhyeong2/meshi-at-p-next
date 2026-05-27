import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FooterProps {
  href?: string;
  onSubmit?: () => void;
  submitText: string;
  onCancel?: () => void;
  cancelText?: string;
  isPending?: boolean;
  disabled?: boolean;
  pendingText?: string;
  submitError?: string;
  className?: string;
}

export function Footer({
  href,
  onCancel,
  onSubmit,
  cancelText = "キャンセル",
  submitText = "投稿する",
  isPending = false,
  disabled = false,
  pendingText = "送信中...",
  submitError,
  className,
}: FooterProps) {
  const isSubmitDisabled = disabled || isPending;

  return (
    <footer className={cn("flex flex-none flex-col", className)}>
      <div className="flex flex-row gap-2 border-t border-slate-200 bg-slate-50 p-4">
        {onCancel && (
          <Button variant="outline" className="h-11 flex-1 rounded-lg text-base" onClick={onCancel}>
            {cancelText}
          </Button>
        )}

        {(href || onSubmit) && (
          <Button
            asChild={!!href}
            className="bg-primary-linear h-11 flex-1 rounded-lg text-base text-white"
            disabled={isSubmitDisabled}
            onClick={onSubmit}
          >
            {href ? (
              <Link className="flex-1" href={href} scroll={false}>
                {submitText}
              </Link>
            ) : (
              <>{isPending ? pendingText : submitText}</>
            )}
          </Button>
        )}
      </div>

      {submitError && (
        <p className="bg-slate-50 px-4 pb-4 text-sm font-medium text-red-500">{submitError}</p>
      )}
    </footer>
  );
}
