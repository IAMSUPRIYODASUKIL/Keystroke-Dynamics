import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="mx-auto max-w-md">
      <Card title="Create your account" subtitle="Something you know — your password.">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}

          <FormField
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <FormField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirm_password}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>

          <p className="text-center text-xs text-[var(--color-text-muted)]">
            Next you'll type a short phrase a few times so we can learn your typing rhythm.
          </p>
        </form>
      </Card>
    </div>
  );
}
