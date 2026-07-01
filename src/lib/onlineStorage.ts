import type { Table } from "dexie";
import { db } from "../db/database";
import { isSupabaseConfigured, supabase } from "./supabase";

type SyncableRecord = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

type OnlineRecordRow = {
  collection: CollectionName;
  record_id: string;
  data: SyncableRecord | null;
  updated_at: string;
  is_deleted: boolean;
};

type CollectionName =
  | "settings"
  | "customers"
  | "customerSpecialDates"
  | "products"
  | "measurements"
  | "orders"
  | "receipts"
  | "invoices"
  | "invoiceItems"
  | "sales"
  | "saleItems"
  | "payments";

const collections: CollectionName[] = [
  "settings",
  "customers",
  "customerSpecialDates",
  "products",
  "measurements",
  "orders",
  "receipts",
  "invoices",
  "invoiceItems",
  "sales",
  "saleItems",
  "payments",
];

const tables: Record<CollectionName, Table<SyncableRecord, string>> = {
  settings: db.settings as Table<SyncableRecord, string>,
  customers: db.customers as Table<SyncableRecord, string>,
  customerSpecialDates: db.customerSpecialDates as Table<SyncableRecord, string>,
  products: db.products as Table<SyncableRecord, string>,
  measurements: db.measurements as Table<SyncableRecord, string>,
  orders: db.orders as Table<SyncableRecord, string>,
  receipts: db.receipts as Table<SyncableRecord, string>,
  invoices: db.invoices as Table<SyncableRecord, string>,
  invoiceItems: db.invoiceItems as Table<SyncableRecord, string>,
  sales: db.sales as Table<SyncableRecord, string>,
  saleItems: db.saleItems as Table<SyncableRecord, string>,
  payments: db.payments as Table<SyncableRecord, string>,
};

let mirrorStarted = false;
let isApplyingRemoteData = false;

function shouldSync() {
  return isSupabaseConfigured;
}

function getRecordTimestamp(record: SyncableRecord) {
  return record.updatedAt || record.createdAt || new Date().toISOString();
}

function reportSyncError(action: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Online storage ${action} failed. Local data is still saved.`, message);
}

async function mirrorRecord(collection: CollectionName, record: SyncableRecord) {
  if (!shouldSync() || isApplyingRemoteData) return;

  const updatedAt = getRecordTimestamp(record);
  const { error } = await supabase.from("online_records").upsert(
    {
      collection,
      record_id: record.id,
      data: record,
      updated_at: updatedAt,
      is_deleted: false,
    },
    { onConflict: "collection,record_id" }
  );

  if (error) throw error;
}

async function mirrorDelete(collection: CollectionName, recordId: string) {
  if (!shouldSync() || isApplyingRemoteData) return;

  const { error } = await supabase.from("online_records").upsert(
    {
      collection,
      record_id: recordId,
      data: null,
      updated_at: new Date().toISOString(),
      is_deleted: true,
    },
    { onConflict: "collection,record_id" }
  );

  if (error) throw error;
}

function queueMirror(promise: Promise<void>) {
  promise.catch((error) => reportSyncError("mirror", error));
}

export function startOnlineStorageMirror() {
  if (mirrorStarted) return;
  mirrorStarted = true;

  collections.forEach((collection) => {
    const table = tables[collection];

    table.hook("creating", (_primaryKey, record) => {
      queueMirror(mirrorRecord(collection, record as SyncableRecord));
    });

    table.hook("updating", (changes, primaryKey, record) => {
      queueMirror(
        mirrorRecord(collection, {
          ...(record as SyncableRecord),
          ...(changes as Partial<SyncableRecord>),
          id: String(primaryKey),
        })
      );
    });

    table.hook("deleting", (primaryKey) => {
      queueMirror(mirrorDelete(collection, String(primaryKey)));
    });
  });
}

export async function syncOnlineStorage() {
  if (!shouldSync()) return;

  const { data, error } = await supabase
    .from("online_records")
    .select("collection, record_id, data, updated_at, is_deleted")
    .in("collection", collections);

  if (error) {
    reportSyncError("pull", error);
    return;
  }

  const rows = (data || []) as OnlineRecordRow[];
  isApplyingRemoteData = true;

  try {
    await db.transaction("rw", Object.values(tables), async () => {
      for (const row of rows) {
        const table = tables[row.collection];
        if (!table) continue;

        if (row.is_deleted) {
          await table.delete(row.record_id);
          continue;
        }

        if (row.data?.id) {
          await table.put(row.data);
        }
      }
    });
  } finally {
    isApplyingRemoteData = false;
  }

  await pushLocalDataOnline();
}

async function pushLocalDataOnline() {
  if (!shouldSync()) return;

  const rows: OnlineRecordRow[] = [];

  for (const collection of collections) {
    const records = await tables[collection].toArray();
    rows.push(
      ...records.map((record) => ({
        collection,
        record_id: record.id,
        data: record,
        updated_at: getRecordTimestamp(record),
        is_deleted: false,
      }))
    );
  }

  if (!rows.length) return;

  const { error } = await supabase
    .from("online_records")
    .upsert(rows, { onConflict: "collection,record_id" });

  if (error) {
    reportSyncError("push", error);
  }
}
