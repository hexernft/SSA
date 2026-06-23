import { useEffect, useState } from "react";
import type { StaffProfile, UserRole } from "../types";
import {
  addExistingAuthUserProfile,
  listStaffProfiles,
  updateStaffProfile,
} from "../lib/staffProfiles";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type ManageStaffProps = {
  currentProfile: StaffProfile;
};

export function ManageStaff({ currentProfile }: ManageStaffProps) {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");

  async function loadProfiles() {
    setError("");
    setIsLoading(true);

    try {
      const data = await listStaffProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load staff profiles.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function updateProfile(id: string, updates: { fullName?: string; role?: UserRole; isActive?: boolean }) {
    setError("");
    setMessage("");

    if (id === currentProfile.id && updates.isActive === false) {
      setError("You cannot deactivate your own admin account while signed in.");
      return;
    }

    try {
      await updateStaffProfile(id, updates);
      setMessage("Staff profile updated.");
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update staff profile.");
    }
  }

  async function addProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await addExistingAuthUserProfile({
        id: newUserId.trim(),
        fullName: newFullName.trim(),
        role: newRole,
      });
      setMessage("Staff profile added. The user can now sign in if their Auth account exists.");
      setNewUserId("");
      setNewFullName("");
      setNewRole("staff");
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add staff profile.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Manage Staff</h2>
          <p>Create staff profiles, activate or deactivate users, and control admin/staff access.</p>
        </div>
      </div>

      {message ? <div className="form-success">{message}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      <div className="two-column-layout">
        <Card>
          <h3>Add Staff Profile</h3>
          <p className="muted-copy">
            First create the user in Supabase Authentication, then paste the Auth user ID here.
            This keeps password handling secure and avoids exposing admin keys inside the app.
          </p>

          <form onSubmit={addProfile} className="stacked-form">
            <label className="field">
              <span>Auth User ID</span>
              <input
                value={newUserId}
                onChange={(event) => setNewUserId(event.target.value)}
                placeholder="Paste Supabase Auth user ID"
                required
              />
            </label>

            <label className="field">
              <span>Full Name</span>
              <input
                value={newFullName}
                onChange={(event) => setNewFullName(event.target.value)}
                placeholder="Staff full name"
                required
              />
            </label>

            <label className="field">
              <span>Role</span>
              <select value={newRole} onChange={(event) => setNewRole(event.target.value as UserRole)}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <Button type="submit">Add Staff Profile</Button>
          </form>
        </Card>

        <Card>
          <h3>Role Guide</h3>
          <div className="role-guide">
            <div>
              <strong>Staff</strong>
              <span>Can enter customers, invoices, jobs, and receipts. Delete and report access are hidden.</span>
            </div>
            <div>
              <strong>Admin</strong>
              <span>Can view reports, manage staff, edit invoice details, and delete records where necessary.</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="section-heading">
          <div>
            <h3>Staff Accounts</h3>
            <p>Only active approved profiles can use the app.</p>
          </div>
          <Button variant="secondary" onClick={loadProfiles}>Refresh</Button>
        </div>

        {isLoading ? <p>Loading staff...</p> : null}

        {!isLoading && profiles.length === 0 ? (
          <div className="empty-state small">No staff profiles found.</div>
        ) : null}

        {!isLoading && profiles.length > 0 ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <strong>{profile.fullName}</strong>
                      <span className="table-subtext">{profile.id}</span>
                    </td>
                    <td>
                      <select
                        value={profile.role}
                        onChange={(event) =>
                          updateProfile(profile.id, { role: event.target.value as UserRole })
                        }
                        disabled={profile.id === currentProfile.id}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-pill ${profile.isActive ? "paid" : "cancelled"}`}>
                        {profile.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(profile.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="button-row compact">
                        <Button
                          variant="secondary"
                          onClick={() => updateProfile(profile.id, { isActive: !profile.isActive })}
                          disabled={profile.id === currentProfile.id}
                        >
                          {profile.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
