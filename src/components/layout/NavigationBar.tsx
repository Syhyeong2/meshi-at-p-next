"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, User, Bookmark, LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { AlertModal } from "@/components/ui/AlertModal";
import { logoutAction } from "@/features/auth/actions";

const topLinks = [
  { href: "/home/places", label: "Map", icon: MapPin },
  { href: "/home/mypage", label: "Mypage", icon: User },
  { href: "/home/bookmarks", label: "BookMark", icon: Bookmark },
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = async () => {
    const result = await logoutAction();

    if (result?.error) {
      throw new Error(result.error);
    }
  };

  return (
    <nav
      className="bg-card z-30 flex h-full w-20 flex-col items-center justify-between border-r border-slate-200 py-4"
      aria-label="Navigation"
    >
      <AlertModal
        isOpen={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        onConfirm={handleLogout}
        confirmText="ログアウト"
        pendingText="ログアウト中..."
        errorMessage="ログアウトに失敗しました。もう一度お試しください。"
        description="本当にログアウトしてもよろしいですか？"
      />
      <div className="flex flex-col gap-4">
        {topLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Button
              key={link.href}
              asChild
              variant={isActive ? "default" : "ghost"}
              className="h-14 w-14 rounded-xl p-0"
            >
              <Link href={link.href} aria-label={link.label}>
                <link.icon className="size-6" />
              </Link>
            </Button>
          );
        })}
      </div>
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          className="h-14 w-14 rounded-xl p-0 text-slate-600 hover:text-slate-950"
          aria-label="Logout"
          onClick={() => setIsLogoutOpen(true)}
        >
          <LogOut className="size-6" />
        </Button>
      </div>
    </nav>
  );
}
