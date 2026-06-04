export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 px-8 py-6">
      <p className="text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} My App. All rights reserved.
      </p>
    </footer>
  );
}
