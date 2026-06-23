import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StaffRole = "admin" | "staff";

function cleanUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Server is missing Supabase environment variables.");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "You must be signed in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Your session could not be verified." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: currentProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!currentProfile || currentProfile.role !== "admin" || currentProfile.is_active !== true) {
      return new Response(
        JSON.stringify({ error: "Only admin users can create staff logins." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    const username = cleanUsername(String(body.username || ""));
    const password = String(body.password || "");
    const role = String(body.role || "staff") as StaffRole;

    if (!fullName) {
      throw new Error("Enter the staff full name.");
    }

    if (!username) {
      throw new Error("Enter a valid username.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    if (!["admin", "staff"].includes(role)) {
      throw new Error("Choose a valid staff role.");
    }

    const { data: existingUsername, error: existingUsernameError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (existingUsernameError) throw existingUsernameError;

    if (existingUsername && existingUsername.length > 0) {
      throw new Error("That username already exists.");
    }

    const email = `${username}@ssa.local`;

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        role,
      },
    });

    if (createUserError) {
      throw createUserError;
    }

    const newUserId = createdUser.user?.id;

    if (!newUserId) {
      throw new Error("Staff login could not be created.");
    }

    const { error: insertProfileError } = await adminClient.from("profiles").insert({
      id: newUserId,
      full_name: fullName,
      username,
      role,
      is_active: true,
    });

    if (insertProfileError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      throw insertProfileError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        username,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create staff login.";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

