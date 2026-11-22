import type { ComponentType, ReactNode } from "react";
import { CadenceTrace } from "@/components/CadenceTrace";

interface AuthShellProps {
  eyebrow: string;
  headline: ReactNode;
  lead: string;
  points: { icon: ComponentType<{ size?: number; className?: string }>; title: string; body: string }[];
  children: ReactNode;
}

/** Split-screen frame for credential flows: brand story on the left (desktop), task on the right. */
export function AuthShell({ eyebrow, headline, lead, points, children }: AuthShellProps) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 lg:min-h-[calc(100vh-14rem)] lg:grid-cols-[1fr_minmax(0,34rem)] xl:grid-cols-[1fr_minmax(0,40rem)] lg:gap-16">
      <aside className="relative hidden lg:block">
        <p className="font-mono text-[11px] tracking-[0.2em] text-(--color-accent) uppercase">{eyebrow}</p>
        <h1 className="font-display text-balance mt-5 text-6xl leading-[1.02] font-light tracking-tight text-(--color-text)">
          {headline}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-(--color-text-muted)">{lead}</p>

        <ul className="mt-10 flex max-w-md flex-col gap-5">
          {points.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="keycap mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-(--color-accent)">
                <Icon size={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-(--color-text)">{title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-(--color-text-muted)">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div aria-hidden="true" className="pointer-events-none mt-12 h-20 max-w-md opacity-80">
          <CadenceTrace seed={13} points={26} className="h-full w-full" />
        </div>
      </aside>

      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}
