"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";

type AlertModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  description: string;
  confirmText: string;
  pendingText?: string;
  errorMessage?: string;
};

const DEFAULT_PENDING_TEXT = "処理中...";
const DEFAULT_ERROR_MESSAGE = "処理に失敗しました。もう一度お試しください。";

function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;

  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function AlertModal({
  isOpen,
  onOpenChange,
  onConfirm,
  description,
  confirmText,
  pendingText = DEFAULT_PENDING_TEXT,
  errorMessage = DEFAULT_ERROR_MESSAGE,
}: AlertModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isConfirming) return;

    setError(null);
    setIsConfirming(false);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isConfirming) return;

    setError(null);
    setIsConfirming(true);

    try {
      await onConfirm();
      setError(null);
      setIsConfirming(false);
      onOpenChange(false);
    } catch (confirmError) {
      if (isNextRedirectError(confirmError)) {
        throw confirmError;
      }

      setError(errorMessage);
      setIsConfirming(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <p className="mt-2 text-base text-slate-950">{description}</p>
        {error ? (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isConfirming}>
            キャンセル
          </Button>
          <Button variant="default" size="sm" onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? pendingText : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
