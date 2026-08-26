import { useCallback, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { RiskBadge, DecisionBadge } from "@/components/Badge";
import { authApi, friendlyErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import type { KeystrokeEvent, LoginResponse } from "@/types";

type Step = "credentials" | "typing" | "result";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setSession } = useAuth();
  const { config } = usePublicConfig();

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
    <div className="mx-auto max-w-md">
      <Card
        title="Log in"
        subtitle={
          step === "credentials"
            ? "Enter your password first — something you know."
            : step === "typing"
              ? "Now type the phrase — something about how you type."
              : undefined
        }
      >
        {step === "credentials" && (
          <form className="flex flex-col gap-4" onSubmit={handleContinue} noValidate>
            {credentialError && <Alert variant="error">{credentialError}</Alert>}
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="mt-2 w-full">
              Continue
            </Button>
          </form>
        )}

        {step === "typing" && config && (
          <div>
            <PhraseTypingBox
              key={boxKey}
              phrase={config.auth_phrase}
              onComplete={submitLogin}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="mt-4 text-xs text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-text)]"
              onClick={() => setStep("credentials")}
            >
              ← Back to credentials
            </button>
          </div>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <DecisionBadge decision={result.decision} />
              <RiskBadge level={result.risk_level} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Password">{result.password_correct ? "Correct" : "Incorrect"}</Field>
              <Field label="Typing pattern">
                {result.typing_evaluated ? (result.similarity_label ?? "—") : "Not evaluated"}
              </Field>
            </dl>

            <Alert variant={result.decision === "success" ? "success" : "error"}>{result.message}</Alert>

            {result.decision === "success" ? (
              <Button onClick={() => navigate(from, { replace: true })}>Continue to dashboard</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => reset("credentials")}>
                  Try again
                </Button>
                {result.password_correct && (
                  <Button variant="secondary" onClick={() => reset("typing")}>
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
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
      <dt className="text-[10px] font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-[var(--color-text)]">{children}</dd>
    </div>
  );
}
