import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/Button";
import { CadenceTrace } from "@/components/CadenceTrace";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 text-center sm:py-24">
      <div className="relative w-full max-w-xl">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(closest-side,var(--aurora-a),transparent)]"
        />
        <p
          className="ember-text font-display text-[9rem] leading-none font-light tracking-tighter select-none sm:text-[13rem]"
          aria-hidden="true"
        >
          404
        </p>
        {/* A flat line: signal lost */}
        <div aria-hidden="true" className="mx-auto -mt-6 h-px w-4/5 bg-linear-to-r from-transparent via-(--color-accent) to-transparent opacity-70" />
        <div aria-hidden="true" className="mx-auto mt-4 h-10 w-3/5 opacity-50">
          <CadenceTrace seed={2} points={12} animated={false} className="h-full w-full" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1 className="font-display text-4xl font-light tracking-tight text-(--color-text) sm:text-5xl">
          Signal <em className="ember-text pr-1 font-normal">lost</em>
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">
          We couldn&apos;t find that page. It may have moved, or the address was mistyped.
        </p>
      </div>

      <Link to="/" tabIndex={-1}>
        <Button size="lg">
          <Home size={16} />
          <span>Back to home</span>
        </Button>
      </Link>
    </div>
  );
}
