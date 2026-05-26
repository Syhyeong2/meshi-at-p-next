"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, User, Bookmark } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { LogoutButton } from "@/features/auth/components/LogoutButton";

const topLinks = [
  { href: "/home/places", label: "Map", icon: MapPin },
  { href: "/home/mypage", label: "Mypage", icon: User },
  { href: "/home/bookmarks", label: "BookMark", icon: Bookmark },
];

export function NavigationSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="bg-card z-30 flex h-16 w-full flex-row items-center justify-between border-t border-slate-200 px-6 py-2 md:h-full md:w-20 md:flex-col md:border-t-0 md:border-r md:px-0 md:py-4"
      aria-label="Navigation"
    >
      <div className="flex flex-1 flex-row justify-around gap-4 md:flex-initial md:flex-col md:justify-start">
        {topLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Button
              key={link.href}
              asChild
              variant={isActive ? "default" : "ghost"}
              className="h-12 w-12 rounded-xl p-0 md:h-14 md:w-14"
            >
              <Link href={link.href} aria-label={link.label}>
                <link.icon className="size-5 md:size-6" />
              </Link>
            </Button>
          );
        })}
      </div>
      <div className="hidden md:flex md:flex-col md:gap-4">
        <LogoutButton className="text-slate-600 hover:text-slate-950 md:h-14 md:w-14" />
      </div>
    </nav>
  );
}
