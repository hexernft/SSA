import type { StaffProfile, UserRole } from "../types";
import { supabase } from "./supabase";

type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

function mapProfile(row: ProfileRow): StaffProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function getMyProfile(userId: string): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProfile(data as ProfileRow);
}

export async function listStaffProfiles(): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at, updated_at")
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

export async function addExistingAuthUserProfile(input: {
  id: string;
  fullName: string;
  role: UserRole;
}) {
  const { error } = await supabase.from("profiles").insert({
    id: input.id,
    full_name: input.fullName,
    role: input.role,
    is_active: true,
  });

  if (error) throw error;
}
