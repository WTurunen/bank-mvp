"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
];

export function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-8">
        <nav className="flex items-center gap-6 h-14">
          <Link href="/" className="font-semibold text-slate-900 mr-4">
            Invoice Manager
          </Link>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/invoices")
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-600 hover:text-gray-900 ml-auto"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
