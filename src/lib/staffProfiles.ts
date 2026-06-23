import type { StaffProfile, UserRole } from "../types";
import { supabase } from "./supabase";

const INTERNAL_LOGIN_DOMAIN = "ssa.local";

type ProfileRow = {
  id: string;
  full_name: string;
  username: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

export function usernameToInternalEmail(username: string) {
  const cleanUsername = normalizeUsername(username);

  if (!cleanUsername) {
    throw new Error("Enter a valid username.");
  }

  return `${cleanUsername}@${INTERNAL_LOGIN_DOMAIN}`;
}

function mapProfile(row: ProfileRow): StaffProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username || "",
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function getMyProfile(userId: string): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, is_active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProfile(data as ProfileRow);
}

export async function listStaffProfiles(): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as ProfileRow[]).map(mapProfile);
}

export async function updateStaffProfile(
  id: string,
  updates: { fullName?: string; role?: UserRole; isActive?: boolean }
) {
  const payload: Record<string, string | boolean> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.fullName !== undefined) payload.full_name = updates.fullName;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const { error } = await supabase.from("profiles").update(payload).eq("id", id);
  if (error) throw error;
}

export async function createStaffLogin(input: {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}) {
  const username = normalizeUsername(input.username);

  if (!username) {
    throw new Error("Enter a valid username.");
  }

  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (!input.fullName.trim()) {
    throw new Error("Enter the staff full name.");
  }

  const email = usernameToInternalEmail(username);

  const { data: existingProfiles, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (existingError) throw existingError;

  if (existingProfiles && existingProfiles.length > 0) {
    throw new Error("That username already exists.");
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
  });

  if (signUpError) throw signUpError;

  const userId = signUpData.user?.id;

  if (!userId) {
    throw new Error("Staff login was not created. Check Supabase email confirmation settings.");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    full_name: input.fullName.trim(),
    username,
    role: input.role,
    is_active: true,
  });

  if (profileError) throw profileError;
}
