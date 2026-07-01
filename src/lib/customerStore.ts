import type { Customer } from "../types";
import { db } from "../db/database";

export async function listCustomers(): Promise<Customer[]> {
  return db.customers.orderBy("createdAt").reverse().toArray();
}

export async function saveCustomerRecord(customer: Customer) {
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
  await db.customers.delete(customerId);
}
