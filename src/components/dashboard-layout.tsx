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
  return <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.15)] px-2 py-2 pb-[env(safe-area-inset-bottom)] relative before:absolute before:inset-x-0 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/15 before:to-transparent">
    {navItems.map((item) => {
      const active = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`relative flex flex-col items-center gap-0.5 px-4 py-2 active:scale-90 transition-[transform,colors] duration-150 ${active
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <item.icon className="size-5" />
          <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          {active && (
            <span className="absolute -bottom-1 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-primary transition-all duration-200" />
          )}
        </Link>
      );
    })}
  </nav>
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
