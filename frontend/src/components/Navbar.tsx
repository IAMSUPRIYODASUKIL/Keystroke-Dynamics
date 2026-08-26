import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  BrainCircuit,
  ShieldAlert,
  PlaySquare,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
  Keyboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Button } from "@/components/Button";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "ML Analytics", icon: BrainCircuit },
  { to: "/activity", label: "Security Activity", icon: ShieldAlert },
  { to: "/demo", label: "Demo Sandbox", icon: PlaySquare },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { soundEnabled, toggleSound } = useSoundEffects();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <NavLink to="/" className="group flex items-center gap-2.5 font-semibold text-[var(--color-text)]">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 border border-[var(--color-accent)]/30 text-[var(--color-accent)] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-[var(--color-accent)]/60 group-hover:shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <Keyboard size={18} className="transition-transform duration-300 group-hover:rotate-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[var(--color-text)] flex items-center gap-1.5">
              Keystroke <span className="gradient-text-cyan">Dynamics</span>
            </span>
            <span className="hidden text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] font-mono sm:inline">
              Biometric Engine
            </span>
          </div>
        </NavLink>

        {/* Primary Desktop Nav Links */}
        {isAuthenticated && (
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-1 backdrop-blur-md md:flex" aria-label="Primary">
            {LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-[var(--color-accent)]/15 to-[var(--color-accent-secondary)]/15 text-[var(--color-accent)] shadow-sm border border-[var(--color-accent)]/30 font-semibold"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-highlight)]",
                    )
                  }
                >
                  <Icon size={14} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}

        {/* Right Actions: Audio Toggle, Theme Toggle, User Profile / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Effects Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            title={soundEnabled ? "Sound effects: ON" : "Sound effects: OFF"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-all hover:text-[var(--color-text)] hover:border-[var(--color-border-glow)] cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={15} className="text-[var(--color-accent)]" /> : <VolumeX size={15} />}
          </button>

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark / light theme"
            title={`Current theme: ${resolvedTheme}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-all hover:text-[var(--color-text)] hover:border-[var(--color-border-glow)] cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun size={15} className="text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon size={15} className="text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Auth State Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* User Avatar Pill */}
              <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 pr-3 pl-1 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-[11px] font-bold text-black shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="max-w-[100px] truncate text-xs font-medium text-[var(--color-text)]">
                  {user?.name}
                </span>
              </div>

              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/login")} className="px-3 py-1.5 text-xs">
                Log in
              </Button>
              <Button onClick={() => navigate("/register")} className="px-3.5 py-1.5 text-xs flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Get started</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {isAuthenticated && (
        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-1.5 backdrop-blur md:hidden" aria-label="Mobile Primary">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-accent)] font-semibold border border-[var(--color-border)]"
                      : "text-[var(--color-text-muted)]",
                  )
                }
              >
                <Icon size={13} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </header>
  );
}

