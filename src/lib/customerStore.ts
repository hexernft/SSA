import type { Customer } from "../types";
import { db } from "../db/database";
import { supabase } from "./supabase";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  wedding_anniversary: string;
  spouse_name: string;
  preferred_style: string;
  preferred_color: string;
  preferred_fabric: string;
  fit_notes: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    birthday: row.birthday || "",
    weddingAnniversary: row.wedding_anniversary || "",
    spouseName: row.spouse_name || "",
    preferredStyle: row.preferred_style || "",
    preferredColor: row.preferred_color || "",
    preferredFabric: row.preferred_fabric || "",
    fitNotes: row.fit_notes || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customerToRow(customer: Customer): CustomerRow {
  return {
    id: customer.id,
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    birthday: customer.birthday || "",
    wedding_anniversary: customer.weddingAnniversary || "",
    spouse_name: customer.spouseName || "",
    preferred_style: customer.preferredStyle || "",
    preferred_color: customer.preferredColor || "",
    preferred_fabric: customer.preferredFabric || "",
    fit_notes: customer.fitNotes || "",
    notes: customer.notes || "",
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase customers load failed. Falling back to local database.", error.message);
    return db.customers.orderBy("createdAt").reverse().toArray();
  }

  const customers = ((data || []) as CustomerRow[]).map(rowToCustomer);

  await db.transaction("rw", db.customers, async () => {
    await db.customers.clear();
    await db.customers.bulkPut(customers);
  });

  return customers;
}

export async function saveCustomerRecord(customer: Customer) {
  const row = customerToRow(customer);

  const { error } = await supabase
    .from("customers")
    .upsert(row, { onConflict: "id" });

  if (error) {
    throw error;
  }

  await db.customers.put(customer);

  return customer;
}

export async function updateCustomerRecord(customerId: string, updates: Partial<Customer>) {
  const existing = await db.customers.get(customerId);

  const merged: Customer = {
    id: customerId,
    name: updates.name ?? existing?.name ?? "",
    phone: updates.phone ?? existing?.phone ?? "",
    email: updates.email ?? existing?.email ?? "",
    address: updates.address ?? existing?.address ?? "",
    birthday: updates.birthday ?? existing?.birthday ?? "",
    weddingAnniversary: updates.weddingAnniversary ?? existing?.weddingAnniversary ?? "",
    spouseName: updates.spouseName ?? existing?.spouseName ?? "",
    preferredStyle: updates.preferredStyle ?? existing?.preferredStyle ?? "",
    preferredColor: updates.preferredColor ?? existing?.preferredColor ?? "",
    preferredFabric: updates.preferredFabric ?? existing?.preferredFabric ?? "",
    fitNotes: updates.fitNotes ?? existing?.fitNotes ?? "",
    notes: updates.notes ?? existing?.notes ?? "",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
  };

  return saveCustomerRecord(merged);
}

export async function deleteCustomerRecord(customerId: string) {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    throw error;
  }

  await db.customers.delete(customerId);
}
