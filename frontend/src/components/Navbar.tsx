import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  BrainCircuit,
  ShieldAlert,
  PlaySquare,
  Volume2,
  VolumeX,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Button } from "@/components/Button";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SPRING } from "@/lib/motion";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "ML Analytics", icon: BrainCircuit },
  { to: "/activity", label: "Security Activity", icon: ShieldAlert },
  { to: "/demo", label: "Demo Sandbox", icon: PlaySquare },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { soundEnabled, toggleSound } = useSoundEffects();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="glass-pill mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-3 shadow-(--card-shadow) sm:pl-4">
          {/* Brand */}
          <NavLink to="/" aria-label="Keystroke Dynamics — home" className="group flex items-center gap-3">
            <BrandMark className="h-9 w-9 transition-transform duration-500 ease-(--ease-premium) group-hover:-rotate-6 group-hover:scale-105" />
            <span className="font-display hidden text-lg font-medium tracking-tight text-(--color-text) sm:block">
              Keystroke <em className="ember-text pr-0.5 font-normal">Dynamics</em>
            </span>
          </NavLink>

          {/* Primary navigation (desktop) */}
          {isAuthenticated && (
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
              {LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      "relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                      isActive ? "text-(--color-text)" : "text-(--color-text-muted) hover:text-(--color-text)",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-pill"
                          transition={SPRING.indicator}
                          className="absolute inset-0 rounded-full border border-(--color-border) bg-(--color-surface-highlight) shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        />
                      )}
                      <Icon size={14} className={clsx("relative", isActive && "text-(--color-accent)")} />
                      <span className="relative">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
              aria-pressed={soundEnabled}
              title={soundEnabled ? "Sound effects: on" : "Sound effects: off"}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-subtle) text-(--color-text-muted) shadow-(--field-shadow) transition-colors hover:border-(--color-border-glow) hover:text-(--color-text)"
            >
              {soundEnabled ? <Volume2 size={15} className="text-(--color-accent)" /> : <VolumeX size={15} />}
            </button>

            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-1">
                <div className="hidden items-center gap-2 rounded-full border border-(--color-border) bg-(--color-bg-subtle) py-1 pr-3.5 pl-1 shadow-(--field-shadow) md:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(image:--color-accent-gradient) text-xs font-bold text-(--color-on-accent)">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[110px] truncate text-xs font-medium text-(--color-text)">{user?.name}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Log out"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="rounded-full! py-2!"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-1">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="rounded-full! px-4!">
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate("/register")} className="rounded-full! px-4! py-2!">
                  <span>Get started</span>
                  <ArrowRight size={13} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile / tablet tab bar */}
      {isAuthenticated && (
        <nav
          aria-label="Mobile primary"
          className="glass-pill fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full p-1.5 shadow-(--card-shadow) lg:hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                clsx(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-colors",
                  isActive ? "text-(--color-accent)" : "text-(--color-text-muted)",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-pill"
                      transition={SPRING.indicator}
                      className="absolute inset-0 rounded-full bg-(--color-surface-highlight)"
                    />
                  )}
                  <Icon size={17} className="relative" />
                  <span className="relative">{label.split(" ")[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
