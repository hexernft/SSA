import { useState } from "react";
import { supabase } from "../lib/supabase";
import logoLight from "../assets/logo-light.png";

type LoginProps = {
  error?: string;
};

export function Login({ error = "" }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLocalError(signInError.message || "Unable to sign in. Check the email and password.");
    }

    setIsSubmitting(false);
  }

  const displayError = localError || error;

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-intro">
          <p className="auth-kicker">Sleek Stitch Atelier</p>
          <h1>Business Console</h1>
          <p className="auth-intro-copy">
            Secure access for staff and administrators to manage jobs, invoices,
            receipts, customers, and business records.
          </p>

          <div className="auth-intro-points">
            <div className="auth-point">
              <strong>Staff</strong>
              <span>Create and update invoices, jobs, customers, and receipts.</span>
            </div>
            <div className="auth-point">
              <strong>Admin</strong>
              <span>Manage staff, reports, settings, and invoice control.</span>
            </div>
          </div>
        </div>

        <form className="auth-card auth-card-dark" onSubmit={handleLogin}>
          <img src={logoLight} alt="Sleek Stitch Atelier" className="auth-logo" />

          <p className="eyebrow auth-eyebrow">Secure Staff Login</p>
          <h2>Welcome back</h2>
          <p className="auth-copy auth-copy-light">
            Sign in to continue to the Sleek Stitch business dashboard.
          </p>

          {displayError ? <div className="form-error auth-error-dark">{displayError}</div> : null}

          <label className="field field-dark">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@sleekstitch.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field field-dark">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="btn btn-primary auth-submit auth-submit-dark" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <p className="auth-note auth-note-light">
            Access is limited to approved Sleek Stitch staff and administrators.
          </p>
        </form>
      </div>
    </div>
  );
}
