"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/format";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Nhân sự", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-nav text-white shadow-md sticky top-0 z-30">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between h-16 sm:h-20 px-4 sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl sm:text-2xl font-semibold"
          >
            <Activity size={24} />
            <span>Waka Tracker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active =
                n.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "px-4 py-3 text-base hover:bg-white/10 rounded-sm transition",
                    active && "border-b-[3px] border-accent",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            className="md:hidden p-2"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open && (
          <nav className="md:hidden flex flex-col gap-1 px-4 pb-3">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 rounded-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
