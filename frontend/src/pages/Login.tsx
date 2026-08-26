import { useCallback, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { Mail, Lock, ShieldCheck, ArrowRight, Sparkles, RefreshCw, KeyRound, Activity } from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { RiskBadge, DecisionBadge } from "@/components/Badge";
import { BiometricRadar } from "@/components/BiometricRadar";
import { authApi, friendlyErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { MODEL_LABELS } from "@/utils/format";
import type { KeystrokeEvent, LoginResponse } from "@/types";

type Step = "credentials" | "typing" | "result";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setSession } = useAuth();
  const { config, error: configError, isLoading: isConfigLoading, refetch: refetchConfig } = usePublicConfig();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<LoginResponse | null>(null);
  const [boxKey, setBoxKey] = useState(0);

  function handleContinue(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setCredentialError("Enter your email and password.");
      return;
    }
    setCredentialError(null);
    setStep("typing");
  }

  const submitLogin = useCallback(
    async (events: KeystrokeEvent[]) => {
      setIsSubmitting(true);
      try {
        const response = await authApi.login({ email, password, events });
        setResult(response);
        setStep("result");
        if (response.decision === "success" && response.access_token && response.user) {
          setSession(response.access_token, response.user);
          try {
            confetti({
              particleCount: 75,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#00f2fe", "#4facfe", "#10b981", "#8b5cf6"],
            });
          } catch {
            // ignore
          }
        }
      } catch (err) {
        setResult({
          decision: "failed",
          risk_level: "unknown",
          password_correct: false,
          typing_evaluated: false,
          similarity_score: null,
          similarity_label: null,
          method_used: null,
          message: friendlyErrorMessage(err),
          access_token: null,
          token_type: "bearer",
          user: null,
        });
        setStep("result");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, setSession],
  );

  function reset(backTo: Step) {
    setResult(null);
    setBoxKey((k) => k + 1);
    setStep(backTo);
  }

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  return (
    <div className="mx-auto max-w-lg">
      {/* Step Progression Indicators */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            step === "credentials"
              ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 shadow-xs"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
          }`}
        >
          <KeyRound size={12} />
          <span>1. Password</span>
        </div>
        <div className="h-0.5 w-4 bg-[var(--color-border)]" />
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            step === "typing"
              ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 shadow-xs"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
          }`}
        >
          <Activity size={12} />
          <span>2. Rhythm Challenge</span>
        </div>
        <div className="h-0.5 w-4 bg-[var(--color-border)]" />
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            step === "result"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
          }`}
        >
          <ShieldCheck size={12} />
          <span>3. Verification</span>
        </div>
      </div>

      <Card
        variant="glow"
        title="Log in"
        subtitle={
          step === "credentials"
            ? "Enter your password first — something you know."
            : step === "typing"
              ? "Now type the phrase — something about how you type."
              : "Authentication Result"
        }
      >
        {step === "credentials" && (
          <form className="flex flex-col gap-4" onSubmit={handleContinue} noValidate>
            {credentialError && <Alert variant="error">{credentialError}</Alert>}
            
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="ada@computing.org"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormField
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" size="lg" className="mt-2 w-full flex items-center justify-center gap-2">
              <span>Continue</span>
              <ArrowRight size={16} />
            </Button>

            <p className="text-center text-xs text-[var(--color-text-muted)]">
              Don't have an enrolled biometric account?{" "}
              <Link to="/register" className="text-[var(--color-accent)] font-medium underline underline-offset-2 hover:brightness-110">
                Register here
              </Link>
            </p>
          </form>
        )}

        {step === "typing" && isConfigLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            <p className="text-sm font-medium text-[var(--color-text)]">Retrieving Challenge Phrase…</p>
            <p className="text-xs text-[var(--color-text-muted)]">Connecting to cryptographic auth pipeline</p>
          </div>
        )}

        {step === "typing" && !isConfigLoading && configError && !config && (
          <div className="flex flex-col gap-4">
            <Alert variant="error">{configError}</Alert>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => refetchConfig()}>
                Retry
              </Button>
              <Button variant="secondary" onClick={() => setStep("credentials")}>
                ← Back to credentials
              </Button>
            </div>
          </div>
        )}

        {step === "typing" && config && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <PhraseTypingBox
              key={boxKey}
              phrase={config.auth_phrase}
              onComplete={submitLogin}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-xs font-medium text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-text)] cursor-pointer"
                onClick={() => setStep("credentials")}
              >
                ← Back to credentials
              </button>
              <button
                type="button"
                onClick={() => setBoxKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
              >
                <RefreshCw size={12} />
                Restart Phrase
              </button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Center Biometric Radar Result */}
            <div className="flex justify-center py-2">
              <BiometricRadar
                score={result.similarity_score}
                riskLevel={result.risk_level}
                size="lg"
                label={result.method_used ? `Scored via ${MODEL_LABELS[result.method_used]}` : "Biometric Match"}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <DecisionBadge decision={result.decision} />
              <RiskBadge level={result.risk_level} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Password Verification">
                <span className={result.password_correct ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {result.password_correct ? "✓ Verified Correct" : "✗ Invalid Password"}
                </span>
              </Field>
              <Field label="Keystroke Cadence">
                <span className="text-[var(--color-text)] font-semibold">
                  {result.typing_evaluated ? (result.similarity_label ?? "—") : "Not Evaluated"}
                </span>
              </Field>
            </dl>

            <Alert variant={result.decision === "success" ? "success" : "error"}>
              {result.message}
            </Alert>

            {result.decision === "success" ? (
              <Button size="lg" onClick={() => navigate(from, { replace: true })} className="w-full flex items-center justify-center gap-2">
                <Sparkles size={16} />
                <span>Enter Security Dashboard</span>
                <ArrowRight size={16} />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => reset("credentials")}>
                  Try again
                </Button>
                {result.password_correct && (
                  <Button variant="primary" className="flex-1" onClick={() => reset("typing")}>
                    Retype phrase
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/90 px-3.5 py-2.5 backdrop-blur-md">
      <dt className="text-[10px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-[var(--color-text)]">{children}</dd>
    </div>
  );
}

