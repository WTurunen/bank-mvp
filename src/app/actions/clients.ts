"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ClientInput = {
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  address?: string;
};

export async function createClient(data: ClientInput): Promise<string> {
  const client = await db.client.create({
    data: {
      name: data.name,
      email: data.email,
      companyName: data.companyName,
      phone: data.phone,
      address: data.address,
    },
  });

  revalidatePath("/clients");
  return client.id;
}

export async function updateClient(id: string, data: ClientInput) {
  await db.client.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      companyName: data.companyName,
      phone: data.phone,
      address: data.address,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function archiveClient(id: string) {
  await db.client.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function restoreClient(id: string) {
  await db.client.update({
    where: { id },
    data: { archivedAt: null },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function getClient(id: string) {
  return db.client.findUnique({
    where: { id },
    include: { invoices: true },
  });
}

export async function getClients(includeArchived = false) {
  return db.client.findMany({
    where: includeArchived ? {} : { archivedAt: null },
    include: { invoices: true },
    orderBy: { name: "asc" },
  });
}
