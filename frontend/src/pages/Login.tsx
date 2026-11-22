import { useCallback, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
  KeyRound,
  Activity,
  Fingerprint,
  Check,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { RiskBadge, DecisionBadge } from "@/components/Badge";
import { BiometricRadar } from "@/components/BiometricRadar";
import { AuthShell } from "@/components/AuthShell";
import { Stepper } from "@/components/Stepper";
import { CadenceTrace } from "@/components/CadenceTrace";
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
              colors: ["#e8622c", "#ff9a62", "#ffd2a8", "#6ed3a8", "#f5efea"],
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

  const stepIndex = step === "credentials" ? 0 : step === "typing" ? 1 : 2;

  return (
    <AuthShell
      eyebrow="Two-factor sign in"
      headline={
        <>
          Welcome <em className="ember-text pr-1 font-normal">back</em>.
        </>
      }
      lead="Prove what you know with your password, then prove who you are by typing a single sentence."
      points={[
        { icon: KeyRound, title: "Something you know", body: "Your password is verified first." },
        { icon: Fingerprint, title: "Something about how you type", body: "Dwell and flight timing are scored in real time." },
        { icon: ShieldCheck, title: "A decision you can inspect", body: "Every attempt is logged with its risk level." },
      ]}
    >
    <div className="mx-auto w-full max-w-xl">
      <Stepper
        className="mb-6 flex-wrap"
        current={stepIndex}
        steps={[
          { label: "Password", icon: KeyRound },
          { label: "Rhythm", icon: Activity },
          { label: "Verified", icon: ShieldCheck },
        ]}
      />

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

            <Button type="submit" size="lg" className="mt-2 w-full">
              <span>Continue</span>
              <ArrowRight size={16} />
            </Button>

            <p className="text-center text-xs text-(--color-text-muted)">
              Don't have an enrolled biometric account?{" "}
              <Link to="/register" className="font-medium text-(--color-accent) underline underline-offset-4 hover:brightness-110">
                Register here
              </Link>
            </p>
          </form>
        )}

        {step === "typing" && isConfigLoading && (
          <div role="status" className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div aria-hidden="true" className="h-12 w-48">
              <CadenceTrace seed={3} points={18} className="h-full w-full" />
            </div>
            <p className="text-sm font-medium text-(--color-text)">Retrieving challenge phrase…</p>
            <p className="text-xs text-(--color-text-muted)">Connecting to the authentication pipeline</p>
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
                className="cursor-pointer text-xs font-medium text-(--color-text-muted) underline underline-offset-4 transition-colors hover:text-(--color-text)"
                onClick={() => setStep("credentials")}
              >
                ← Back to credentials
              </button>
              <button
                type="button"
                onClick={() => setBoxKey((k) => k + 1)}
                className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-(--color-accent) hover:underline hover:underline-offset-4"
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
                <span
                  className={
                    result.password_correct
                      ? "flex items-center gap-1.5 font-semibold text-(--color-success)"
                      : "flex items-center gap-1.5 font-semibold text-(--color-danger)"
                  }
                >
                  {result.password_correct ? <Check size={14} /> : <X size={14} />}
                  {result.password_correct ? "Verified Correct" : "Invalid Password"}
                </span>
              </Field>
              <Field label="Keystroke Cadence">
                <span className="text-(--color-text) font-semibold">
                  {result.typing_evaluated ? (result.similarity_label ?? "—") : "Not Evaluated"}
                </span>
              </Field>
            </dl>

            <Alert variant={result.decision === "success" ? "success" : "error"}>
              {result.message}
            </Alert>

            {result.decision === "success" ? (
              <Button size="lg" onClick={() => navigate(from, { replace: true })} className="w-full">
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
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) px-4 py-3 shadow-(--field-shadow)">
      <dt className="text-[10px] font-semibold tracking-[0.14em] text-(--color-text-muted) uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-(--color-text)">{children}</dd>
    </div>
  );
}

