"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme as "light" | "dark" | "system"}
      position="bottom-center"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
      }}
    />
  );
}
