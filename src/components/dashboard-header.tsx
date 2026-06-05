"use client";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, right }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right}
      </div>
    </header>
  );
}
