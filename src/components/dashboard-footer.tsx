export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t px-8 py-6">
      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} My App. All rights reserved.
      </p>
    </footer>
  );
}
