import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const STEPS = [
  {
    title: "1. Register & set a password",
    body: "You create an account the normal way — something you know.",
  },
  {
    title: "2. Learn your typing rhythm",
    body: "You type a fixed phrase several times. The browser captures keydown/keyup timing for that phrase only.",
  },
  {
    title: "3. Extract behavioral features",
    body: "Dwell time, flight time, inter-key intervals and typing speed are computed from those timestamps.",
  },
  {
    title: "4. Train a personal model",
    body: "Random Forest, SVM and Logistic Regression are trained and compared to tell your rhythm apart from others.",
  },
  {
    title: "5. Verify at login",
    body: "Your password is checked first, then your live typing sample is scored against your enrolled profile.",
  },
];

export function Landing() {
  return (
    <div className="flex flex-col gap-16">
      <section className="pt-8 text-center sm:pt-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-medium text-[var(--color-accent)]">
          Academic research prototype
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
          Your password identifies <span className="text-[var(--color-accent)]">what you know</span>.
          <br />
          Your typing pattern hints at <span className="text-[var(--color-accent)]">how you type</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--color-text-muted)] sm:text-lg">
          A working demonstration of keystroke dynamics — a behavioral biometric — layered on top of
          conventional password authentication, built end-to-end with real machine learning, not
          simulated scores.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register">
            <Button className="px-6 py-3 text-base">Create an account</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className="px-6 py-3 text-base">
              I already have one
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-center text-2xl font-semibold text-[var(--color-text)]">How it works</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {STEPS.map((step) => (
            <Card key={step.title} className="text-sm">
              <p className="font-semibold text-[var(--color-accent)]">{step.title}</p>
              <p className="mt-2 text-[var(--color-text-muted)]">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="The machine learning, honestly explained">
          <p className="text-sm text-[var(--color-text-muted)]">
            Three interpretable classifiers — Random Forest, SVM, and Logistic Regression — are trained
            on your enrolled typing samples versus other enrolled users, then compared on accuracy,
            precision, recall, F1, and the metrics that matter specifically for authentication: the
            False Acceptance Rate (how often an impostor is let in) and False Rejection Rate (how often
            you are wrongly rejected). Nothing here is a hardcoded confidence value — every number comes
            from an actual evaluation run.
          </p>
        </Card>
        <Card title="What this is (and isn't)">
          <p className="text-sm text-[var(--color-text-muted)]">
            Keystroke dynamics is a genuine, actively researched behavioral biometric — but it is not a
            silver bullet. It is best positioned as an <em>additional signal</em> alongside a password,
            not a replacement for one. Typing rhythm can shift with fatigue, injury, a different
            keyboard, or emotional state, and small enrolled datasets (as in this student prototype)
            cannot claim production-grade accuracy. See the Limitations section of the documentation for
            the full, honest picture.
          </p>
        </Card>
      </section>
    </div>
  );
}
