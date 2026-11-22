import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Fingerprint,
  Cpu,
  Layers,
  ShieldCheck,
  Activity,
  KeyRound,
  Timer,
  Gauge,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { CadenceTrace } from "@/components/CadenceTrace";
import { RhythmBars } from "@/components/RhythmBars";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { summarizeRhythm } from "@/utils/rhythm";
import type { KeystrokeEvent } from "@/types";

const STEPS = [
  {
    step: "01",
    title: "Register & password",
    body: "Create your identity with the familiar “something you know” password layer.",
    icon: KeyRound,
    span: "lg:col-span-2",
  },
  {
    step: "02",
    title: "Capture cadence",
    body: "Type a fixed challenge phrase. The browser records raw keydown and keyup timing to the millisecond.",
    icon: Activity,
    span: "lg:col-span-2",
  },
  {
    step: "03",
    title: "Feature extraction",
    body: "Dwell time, flight time, inter-key intervals and cadence velocity become a biometric feature vector.",
    icon: Cpu,
    span: "lg:col-span-2",
  },
  {
    step: "04",
    title: "Tri-model training",
    body: "Random Forest, SVM and Logistic Regression are trained and benchmarked against other enrolled profiles, so you can see which one actually separates you from impostors.",
    icon: Layers,
    span: "lg:col-span-3",
  },
  {
    step: "05",
    title: "Two-factor verification",
    body: "Your password is checked first, then behavioral scoring runs in real time to flag credential stuffing and stolen passwords.",
    icon: ShieldCheck,
    span: "lg:col-span-3",
  },
];

const PREVIEW_PHRASE = "the quick brown fox";

export function Landing() {
  const [sample, setSample] = useState<KeystrokeEvent[] | null>(null);
  const [boxKey, setBoxKey] = useState(0);

  const summary = useMemo(() => (sample ? summarizeRhythm(sample) : null), [sample]);

  const reset = () => {
    setSample(null);
    setBoxKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-24 md:gap-36">
      {/* Hero */}
      <section className="relative pt-4 text-center sm:pt-10">
        <Stagger step={0.09} className="relative z-10 flex flex-col items-center">
          <StaggerItem>
            <div className="glass-pill inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs font-semibold shadow-(--card-shadow)">
              <span className="animate-pulse-ring flex h-2 w-2 rounded-full bg-(--color-accent)" />
              <span className="font-mono tracking-[0.16em] text-(--color-text-secondary) uppercase">
                Behavioral biometrics
              </span>
              <span className="hidden h-3 w-px bg-(--color-border) sm:block" />
              <span className="hidden text-[11px] text-(--color-text-muted) sm:inline">Zero simulated data</span>
            </div>
          </StaggerItem>

          <StaggerItem>
            <h1 className="font-display text-balance mx-auto mt-8 max-w-5xl text-[2.75rem] leading-[1.02] font-light tracking-tight text-(--color-text) sm:text-7xl lg:text-[5.5rem]">
              Your password is what you <em className="ember-text pr-1 font-normal">know</em>. Your rhythm is who you{" "}
              <em className="ember-text pr-1 font-normal">are</em>.
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-pretty text-(--color-text-muted) sm:text-lg">
              A behavioral authentication engine that recognises people by the way they type. Live machine-learning
              scoring, dwell and flight-time feature extraction, and fraud detection, all running against real data.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link to="/register" tabIndex={-1}>
                <Button size="lg">
                  <span>Enroll your rhythm</span>
                  <ArrowRight size={17} />
                </Button>
              </Link>
              <Link to="/login" tabIndex={-1}>
                <Button variant="secondary" size="lg">
                  <Fingerprint size={18} className="text-(--color-accent)" />
                  <span>Authenticate</span>
                </Button>
              </Link>
            </div>
          </StaggerItem>

          <StaggerItem className="mt-12 w-full">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-(--color-text-muted)">
              {["Random Forest · SVM · Logistic Regression", "Millisecond key timing", "FAR and FRR validated"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-(--color-accent)" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </StaggerItem>
        </Stagger>

        <div aria-hidden="true" className="pointer-events-none mx-auto mt-14 h-24 max-w-4xl opacity-90 sm:h-32">
          <CadenceTrace seed={21} points={34} className="h-full w-full" />
        </div>
      </section>

      {/* Interactive sandbox */}
      <section className="relative" aria-labelledby="sandbox-title">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <Card
              variant="glow"
              title={<span id="sandbox-title">Try the rhythm engine</span>}
              subtitle="Type the sentence below. Nothing leaves your browser — this is a live capture of your own cadence."
            >
              {!summary ? (
                <PhraseTypingBox key={boxKey} phrase={PREVIEW_PHRASE} onComplete={setSample} />
              ) : (
                <div className="animate-fadeIn flex flex-col gap-7">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Avg dwell", value: `${Math.round(summary.avgDwell)} ms`, icon: Timer },
                      { label: "Avg flight", value: `${Math.round(summary.avgFlight)} ms`, icon: Activity },
                      { label: "Speed", value: `${summary.cps.toFixed(1)} /s`, icon: Gauge },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) px-2 py-4 shadow-(--field-shadow)"
                      >
                        <Icon size={15} className="mx-auto text-(--color-accent)" />
                        <p className="font-display mt-2 text-2xl font-medium text-(--color-text) tabular-nums sm:text-3xl">
                          <AnimatedNumber value={value} />
                        </p>
                        <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-(--color-text-muted) uppercase">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-(--color-text-muted) uppercase">
                      Your cadence · time between keystrokes
                    </p>
                    <RhythmBars intervals={summary.intervals} />
                  </div>

                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="max-w-md text-sm leading-relaxed text-(--color-text-muted)">
                      That is your real timing signature. Enroll a few samples and the three models learn to tell it
                      apart from everyone else&apos;s.
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={reset}>
                        <RotateCcw size={13} />
                        Try again
                      </Button>
                      <Link to="/register" tabIndex={-1}>
                        <Button size="sm">
                          Enroll
                          <ArrowRight size={13} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </Reveal>
      </section>

      {/* How it works — bento */}
      <section aria-labelledby="how-title">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-(--color-accent) uppercase">The pipeline</p>
          <h2
            id="how-title"
            className="font-display text-balance mt-4 text-4xl font-light tracking-tight text-(--color-text) sm:text-6xl"
          >
            From keypress to <em className="ember-text pr-1 font-normal">consensus</em>
          </h2>
          <p className="mt-5 text-base text-(--color-text-muted)">
            Five steps turn tactile timing into a decision you can inspect.
          </p>
        </Reveal>

        <Stagger step={0.08} className="grid gap-4 lg:grid-cols-6">
          {STEPS.map(({ step, title, body, icon: Icon, span }) => (
            <StaggerItem key={step} className={span}>
              <Card className="group h-full">
                <div className="flex items-start justify-between">
                  <span className="font-display text-6xl leading-none font-light text-(--color-text-dim)/70 transition-colors duration-500 group-hover:text-(--color-accent)">
                    {step}
                  </span>
                  <div className="keycap flex h-11 w-11 items-center justify-center rounded-xl text-(--color-accent)">
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="font-display mt-8 text-2xl font-medium tracking-tight text-(--color-text)">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">{body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Honesty */}
      <section className="grid gap-4 md:grid-cols-2" aria-label="Scientific transparency">
        <Reveal>
          <Card
            className="h-full"
            title="Machine learning, honestly explained"
            subtitle="Transparent evaluation and interpretable metrics"
          >
            <p className="text-sm leading-relaxed text-(--color-text-secondary)">
              Three interpretable classifiers — <strong className="text-(--color-text)">Random Forest</strong>,{" "}
              <strong className="text-(--color-text)">Support Vector Machines</strong> and{" "}
              <strong className="text-(--color-text)">Logistic Regression</strong> — are trained on your enrolled
              samples against impostor cohorts, and scored on cross-validated accuracy, precision, recall, F1 and the
              biometric standards <strong className="text-(--color-accent)">False Acceptance Rate</strong> and{" "}
              <strong className="text-(--color-accent)">False Rejection Rate</strong>.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card
            className="h-full"
            title="What this is, and isn't"
            subtitle="Academic rigor and real behavioral limits"
          >
            <p className="text-sm leading-relaxed text-(--color-text-secondary)">
              Keystroke dynamics is a genuine, actively researched biometric — but it is an{" "}
              <em className="text-(--color-text)">extra layer of defense</em>, not a replacement for your password.
              Typing rhythm shifts with fatigue, keyboards, caffeine or injury, so this system shows its confidence
              thresholds openly rather than hiding them.
            </p>
          </Card>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <Reveal>
        <section className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,var(--aurora-a),transparent)]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 opacity-40">
            <CadenceTrace seed={5} points={30} animated={false} className="h-full w-full" />
          </div>
          <div className="relative">
            <h2 className="font-display text-balance mx-auto max-w-2xl text-4xl font-light tracking-tight text-(--color-text) sm:text-6xl">
              Make your typing <em className="ember-text pr-1 font-normal">unforgettable</em>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base text-(--color-text-muted)">
              Enrollment takes a minute. Verification takes a sentence.
            </p>
            <div className="mt-9 flex justify-center">
              <Link to="/register" tabIndex={-1}>
                <Button size="lg">
                  <span>Get started</span>
                  <ArrowRight size={17} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
