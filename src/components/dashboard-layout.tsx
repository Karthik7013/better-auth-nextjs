"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Heart, Settings, LucideIcon } from "lucide-react";


const navItems: NavItemProps[] = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Explore", icon: Search, href: "/explore" },
  { label: "Favorites", icon: Heart, href: "/favorites" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

type NavItemProps = {
  label: string,
  icon: LucideIcon,
  href: string
}
const BottomNavbar = ({ navItems }: {
  navItems: NavItemProps[]
}) => {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-evenly bg-background/80 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.1)] py-1 pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-1 px-6 py-2 transition-colors duration-150 ${active ? "text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
          >
            {active && (
              <span className="absolute top-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-primary" />
            )}
            <item.icon className={`size-6 transition-transform duration-150 ${active ? "scale-110" : ""}`} />
            {active && (
              <span className="text-[10px] font-medium">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <div className="relative h-dvh">
      <main className="h-full overflow-y-auto pb-16">
        {children}
      </main>
      <BottomNavbar navItems={navItems} />
    </div>
  );
}
