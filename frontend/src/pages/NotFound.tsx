import { Link } from "react-router-dom";
import { Button } from "@/components/Button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-5xl font-bold text-[var(--color-text-muted)]">404</p>
      <p className="text-[var(--color-text-muted)]">This page doesn't exist.</p>
      <Link to="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>
  );
}
