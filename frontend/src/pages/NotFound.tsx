import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/Button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-(--color-border) bg-(--color-surface-raised)/80 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle,rgba(0,242,254,0.2)_0%,transparent_70%)] animate-pulse" />
        <Compass size={40} className="relative z-10 text-(--color-accent) animate-spin" style={{ animationDuration: "12s" }} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-5xl font-extrabold tracking-tight gradient-text-cyan">
          404
        </span>
        <h1 className="text-xl font-bold text-(--color-text)">
          Spatial Biometric Anomaly
        </h1>
        <p className="max-w-sm text-xs text-(--color-text-muted) leading-relaxed">
          The requested coordinate does not exist in the cryptographic ledger or routing matrix.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button size="md" className="flex items-center gap-2">
            <Home size={15} />
            <span>Return to Matrix Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

