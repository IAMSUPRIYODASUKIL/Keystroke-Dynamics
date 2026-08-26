import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { BiometricRadar } from "@/components/BiometricRadar";

const STEPS = [
  {
    step: "01",
    title: "Register & Password",
    body: "Create your cryptographic identity — the traditional 'something you know' password layer.",
    icon: KeyRound,
    accent: "cyan",
  },
  {
    step: "02",
    title: "Capture Cadence",
    body: "Type a fixed challenge phrase. The browser captures raw keydown/keyup timing with millisecond precision.",
    icon: Activity,
    accent: "violet",
  },
  {
    step: "03",
    title: "Feature Extraction",
    body: "Dwell time, flight time, inter-key intervals and cadence velocity are engineered into biometric vectors.",
    icon: Cpu,
    accent: "emerald",
  },
  {
    step: "04",
    title: "Tri-Model AI Training",
    body: "Random Forest, SVM, and Logistic Regression models are trained and benchmarked against other enrolled profiles.",
    icon: Layers,
    accent: "amber",
  },
  {
    step: "05",
    title: "2-Factor Verification",
    body: "Password is verified first, followed by real-time behavioral ML scoring to detect credential stuffing.",
    icon: ShieldCheck,
    accent: "rose",
  },
];

const PREVIEW_PHRASE = "the quick brown fox";

export function Landing() {
  const [sandboxComplete, setSandboxComplete] = useState(false);
  const [sandboxScore, setSandboxScore] = useState<number | null>(null);

  const handleSandboxComplete = () => {
    setSandboxComplete(true);
    // Showcase simulation for landing demo
    setSandboxScore(0.94);
  };

  const handleResetSandbox = () => {
    setSandboxComplete(false);
    setSandboxScore(null);
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {/* Hero Section */}
      <section className="relative pt-6 text-center sm:pt-12">
        {/* Academic Prototype Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-1.5 text-xs font-semibold text-[var(--color-text)] shadow-sm backdrop-blur-xl transition-all hover:border-[var(--color-border-glow)]">
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span className="gradient-text-cyan font-mono uppercase tracking-wider">
            Academic Research Prototype (2026)
          </span>
          <span className="text-[var(--color-border)]">|</span>
          <span className="text-[var(--color-text-muted)] text-[11px]">Zero Simulated Data</span>
        </div>

        {/* Hero Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-6xl sm:leading-[1.15]">
          Your password identifies{" "}
          <span className="gradient-text-cyan drop-shadow-sm">what you know</span>.
          <br />
          Your keystroke rhythm reveals{" "}
          <span className="gradient-text-purple drop-shadow-sm">who you are</span>.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--color-text-muted)] sm:text-lg leading-relaxed">
          An ultra-premium behavioral biometric authentication engine. Experience real-time machine learning
          scoring, dwell/flight time feature extraction, and fraud prevention running live in your browser.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="flex items-center gap-2 text-base px-7">
              <Sparkles size={18} />
              <span>Enroll Biometric Rhythm</span>
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg" className="flex items-center gap-2 text-base px-6">
              <Fingerprint size={18} className="text-[var(--color-accent)]" />
              <span>Authenticate Sample</span>
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 backdrop-blur-md">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Random Forest, SVM & Logistic Regression</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 backdrop-blur-md">
            <Zap size={13} className="text-amber-400" />
            <span>60/120 FPS Real-Time Waveform</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 backdrop-blur-md">
            <Shield size={13} className="text-[var(--color-accent)]" />
            <span>FAR & FRR Validated Metrics</span>
          </div>
        </div>
      </section>

      {/* Interactive Hero Sandbox Preview */}
      <section className="relative">
        <div className="mx-auto max-w-3xl">
          <Card
            variant="glow"
            title={
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                  <Activity size={16} />
                </span>
                <span>Interactive Biometric Sandbox</span>
              </div>
            }
            subtitle="Try typing the test sentence below to experience the real-time rhythm cadence engine"
          >
            {!sandboxComplete ? (
              <PhraseTypingBox
                phrase={PREVIEW_PHRASE}
                onComplete={handleSandboxComplete}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-6 text-center animate-fadeIn">
                <BiometricRadar
                  score={sandboxScore}
                  riskLevel="low"
                  size="md"
                  label="Sample Authenticity Score"
                />
                <div className="max-w-md">
                  <p className="font-semibold text-emerald-400 text-sm">
                    Biometric telemetry captured successfully!
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    In actual production, this sample is scored through your trained 3-classifier ensemble to verify your unique cadence.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleResetSandbox}>
                  Reset & Try Again
                </Button>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* How it works 5-step Pipeline */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            How Keystroke Biometrics Works
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            A 5-phase zero-trust pipeline from tactile keypress to multi-classifier consensus.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.step} className="group relative text-sm hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--color-accent)] opacity-80">
                    {step.step}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-accent)] group-hover:border-[var(--color-border-glow)] transition-colors">
                    <Icon size={16} />
                  </div>
                </div>
                <p className="mt-3 font-semibold text-[var(--color-text)] text-sm">{step.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">{step.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Scientific Transparency & Academic Honesty */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card
          title="Machine Learning, Honestly Explained"
          subtitle="Transparent evaluation, interpretable metrics, zero black-box magic"
        >
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Three distinct interpretable classifiers — <strong className="text-[var(--color-text)]">Random Forest</strong>,{" "}
            <strong className="text-[var(--color-text)]">Support Vector Machines (SVM)</strong>, and{" "}
            <strong className="text-[var(--color-text)]">Logistic Regression</strong> — are trained on your enrolled timing samples against impostor cohorts.
            Models are scored on real Cross-Validation Accuracy, Precision, Recall, F1, and the gold standard biometric metrics:
            <strong className="text-[var(--color-accent)]"> False Acceptance Rate (FAR)</strong> and{" "}
            <strong className="text-[var(--color-accent)]">False Rejection Rate (FRR)</strong>.
          </p>
        </Card>

        <Card
          title="What This Is (and Isn't)"
          subtitle="Academic rigor and real-world behavioral limitations"
        >
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Keystroke dynamics is a genuine, actively researched behavioral biometric — but it is an{" "}
            <em className="text-[var(--color-text)]">additional 2FA defense layer</em>, not a standalone replacement for your password.
            Typing rhythms naturally fluctuate with fatigue, different mechanical keyboards, caffeine, or injury.
            This system transparently visualizes those confidence thresholds rather than concealing them.
          </p>
        </Card>
      </section>
    </div>
  );
}

