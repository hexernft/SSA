import { useState } from "react";
import { supabase } from "../lib/supabase";
import { usernameToInternalEmail } from "../lib/staffProfiles";
import logoLight from "../assets/logo-light.png";

type LoginProps = {
  error?: string;
};

export function Login({ error = "" }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    setIsSubmitting(true);

    try {
      const email = usernameToInternalEmail(username);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setLocalError("Unable to sign in. Check the username and password.");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Unable to sign in.");
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
            Sign in with your staff username and password.
          </p>

          {displayError ? <div className="form-error auth-error-dark">{displayError}</div> : null}

          <label className="field field-dark">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. blessing"
              autoComplete="username"
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
