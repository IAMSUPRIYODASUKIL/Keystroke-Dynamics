import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/Button";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "ML Analytics" },
  { to: "/activity", label: "Security Activity" },
  { to: "/demo", label: "Demo Mode" },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            ⌨
          </span>
          <span className="hidden sm:inline">Keystroke Auth</span>
        </NavLink>

        {isAuthenticated && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-[var(--color-text-muted)] sm:inline">{user?.name}</span>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button onClick={() => navigate("/register")}>Get started</Button>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--color-border)] px-4 py-1 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  "shrink-0 rounded-lg px-3 py-2 text-sm font-medium",
                  isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
