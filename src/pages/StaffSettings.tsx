import { useEffect, useState } from "react";
import type { StaffProfile } from "../types";
import { supabase } from "../lib/supabase";
import { updateStaffProfile, usernameToInternalEmail } from "../lib/staffProfiles";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type StaffSettingsProps = {
  profile: StaffProfile;
  onProfileSaved: (profile: StaffProfile) => void;
};

export function StaffSettings({ profile, onProfileSaved }: StaffSettingsProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName);
  }, [profile.fullName]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanFullName = fullName.trim();
    if (!cleanFullName) {
      setError("Enter your full name.");
      return;
    }

    setIsSavingProfile(true);

    try {
      await updateStaffProfile(profile.id, { fullName: cleanFullName });
      const updatedProfile = {
        ...profile,
        fullName: cleanFullName,
        updatedAt: new Date().toISOString(),
      };

      onProfileSaved(updatedProfile);
      setMessage("Profile settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile settings.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!profile.username) {
      setError("This account does not have a staff username.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const email = usernameToInternalEmail(profile.username);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="My Settings"
          subtitle="Manage your staff account details, password, and basic access information."
        />
      </div>

      {message ? <div className="form-success">{message}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      <div className="two-column-layout">
        <Card>
          <h3>Profile</h3>

          <form onSubmit={saveProfile} className="stacked-form">
            <label className="field">
              <span>Full Name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </label>

            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Card>

        <Card>
          <h3>Account Details</h3>

          <div className="profile-grid">
            <div>
              <span>Username</span>
              <strong>{profile.username || "Not set"}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{profile.role}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{profile.isActive ? "Active" : "Inactive"}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{new Date(profile.createdAt).toLocaleDateString()}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3>Change Password</h3>

        <form onSubmit={changePassword} className="stacked-form staff-password-form">
          <label className="field">
            <span>Current Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <div className="two-grid">
            <label className="field">
              <span>New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="field">
              <span>Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          </div>

          <Button type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
