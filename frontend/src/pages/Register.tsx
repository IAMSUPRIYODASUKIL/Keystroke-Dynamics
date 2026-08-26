import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Sparkles, ArrowRight, Shield } from "lucide-react";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
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
    "bg-slate-600",
    "bg-rose-500",
    "bg-amber-500",
    "bg-cyan-400",
    "bg-emerald-400",
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
    <div className="mx-auto max-w-lg">
      <Card
        variant="glow"
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--color-accent)/15 text-(--color-accent)">
              <Shield size={18} />
            </span>
            <span>Create Secure Profile</span>
          </div>
        }
        subtitle="Establish your cryptographic identity before calibrating your typing rhythm."
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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

          {/* Dynamic Password Strength Meter */}
          {password.length > 0 && (
            <div className="flex flex-col gap-1.5 px-1 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-(--color-text-muted)">Password Strength:</span>
                <span className="font-semibold text-(--color-text)">
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 w-full overflow-hidden rounded-full bg-(--color-border)">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength >= step ? strengthColors[passwordStrength] : "bg-transparent"
                    }`}
                  />
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

          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full flex items-center justify-center gap-2">
            <Sparkles size={16} />
            <span>Create Profile & Calibrate Biometrics</span>
            <ArrowRight size={16} />
          </Button>

          <p className="text-center text-xs text-(--color-text-muted)">
            Already have an account?{" "}
            <Link to="/login" className="text-(--color-accent) font-medium underline underline-offset-2 hover:brightness-110">
              Log in here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

