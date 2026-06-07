"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Film, Tags, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Movies", icon: Film, href: "/admin/movies" },
  { label: "Tags", icon: Tags, href: "/admin/tags" },
  { label: "Users", icon: Users, href: "/admin/users" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-dvh">
      <aside className="flex w-64 flex-col border-r bg-background">
        <div className="flex flex-col gap-1 p-4">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to app
          </Link>
        </div>
        <Separator />
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2",
                      active && "bg-muted font-medium"
                    )}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
