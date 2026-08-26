import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
        Academic research prototype — keystroke dynamics is demonstrated as an additional behavioral
        signal, not a replacement for your password.
      </footer>
    </div>
  );
}
