import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Shield, KeyRound, Activity, Layers } from "lucide-react";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { authApi, friendlyErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute password strength score (0 to 4)
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabels = ["Too Weak", "Weak", "Fair", "Strong", "Military-Grade"];
  const strengthColors = [
    "bg-(--color-text-dim)",
    "bg-(--color-danger)",
    "bg-(--color-warning)",
    "bg-(--color-accent)",
    "bg-(--color-success)",
  ];

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (name.trim().length < 2) errors.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";
    if (password.length < 8) errors.password = "Use at least 8 characters.";
    if (confirmPassword !== password) errors.confirm_password = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await authApi.register({
        name,
        email,
        password,
        confirm_password: confirmPassword,
      });
      login(result.access_token, result.user);
      navigate("/enroll", { replace: true });
    } catch (err) {
      setFormError(friendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Create your profile"
      headline={
        <>
          Teach it your <em className="ember-text pr-1 font-normal">rhythm</em>.
        </>
      }
      lead="Set up a password, then type one short phrase a few times. The models learn the timing that makes it yours."
      points={[
        { icon: KeyRound, title: "Create a secure account", body: "Passwords are hashed, never stored." },
        { icon: Activity, title: "Capture your cadence", body: "Type the phrase several times to build your profile." },
        { icon: Layers, title: "Train three models", body: "Random Forest, SVM and Logistic Regression compete." },
      ]}
    >
      <Card
        variant="glow"
        className="mx-auto w-full max-w-xl"
        title={
          <div className="flex items-center gap-3">
            <span className="keycap flex h-10 w-10 items-center justify-center rounded-xl text-(--color-accent)">
              <Shield size={18} />
            </span>
            <span>Create secure profile</span>
          </div>
        }
        subtitle="Establish your identity before calibrating your typing rhythm."
      >
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}

          <FormField
            label="Full name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <FormField
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="ada@computing.org"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <FormField
            label="Master Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          {/* Password strength meter */}
          {password.length > 0 && (
            <div className="animate-fadeIn flex flex-col gap-2 px-1" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs">
                <span className="text-(--color-text-muted)">Password strength</span>
                <span className="font-semibold text-(--color-text)">{strengthLabels[passwordStrength]}</span>
              </div>
              <div className="flex h-1.5 w-full gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="h-full flex-1 overflow-hidden rounded-full bg-(--color-border)">
                    <div
                      className={`h-full w-full origin-left rounded-full transition-transform duration-500 ease-(--ease-premium) ${strengthColors[passwordStrength]}`}
                      style={{ transform: `scaleX(${passwordStrength >= step ? 1 : 0})` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormField
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirm_password}
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
            <span>Create Profile & Calibrate Biometrics</span>
            <ArrowRight size={16} />
          </Button>

          <p className="text-center text-xs text-(--color-text-muted)">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-(--color-accent) underline underline-offset-4 hover:brightness-110"
            >
              Log in here
            </Link>
          </p>
        </form>
      </Card>
    </AuthShell>
  );
}
