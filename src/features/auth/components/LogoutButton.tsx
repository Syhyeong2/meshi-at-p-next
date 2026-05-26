"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AlertModal } from "@/components/ui/AlertModal";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "ghost" | "default" | "outline" | "secondary" | "destructive";
}

export function LogoutButton({ className, variant = "ghost" }: LogoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    const result = await logoutAction();
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleLogout}
        confirmText="ログアウト"
        pendingText="ログアウト中..."
        errorMessage="ログアウトに失敗しました。もう一度お試しください。"
        description="本当にログアウトしてもよろしいですか？"
      />
      <Button
        type="button"
        variant="ghost"
        className={cn("h-12 w-12 rounded-xl p-0", className)}
        aria-label="Logout"
        onClick={() => setIsOpen(true)}
      >
        <LogOut className="size-5 md:size-6" />
      </Button>
    </>
  );
}
