"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { clientSchema, ActionResult, validationError } from "@/lib/schemas";

export type ClientInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export async function createClient(data: ClientInput): Promise<ActionResult<string>> {
  const userId = await getCurrentUserId();

  const validated = clientSchema.safeParse(data);
  if (!validated.success) {
    return validationError(validated.error);
  }

  try {
    const client = await db.client.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath("/clients");
    revalidatePath("/invoices/new");
    revalidatePath("/invoices/[id]", "page");
    return { success: true, data: client.id };
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: false, error: "A client with this email already exists", field: "email" };
    }
    throw error;
  }
}

export async function updateClient(id: string, data: ClientInput) {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.client.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Client not found");
  }

  const validated = clientSchema.safeParse(data);
  if (!validated.success) {
    const firstError = validated.error.issues[0];
    throw new Error(firstError.message);
  }

  try {
    await db.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath("/invoices/new");
    revalidatePath("/invoices/[id]", "page");
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error("A client with this email already exists");
    }
    throw error;
  }
}

export async function archiveClient(id: string) {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.client.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Client not found");
  }

  await db.client.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/invoices/new");
  revalidatePath("/invoices/[id]", "page");
}

export async function restoreClient(id: string) {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.client.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Client not found");
  }

  await db.client.update({
    where: { id },
    data: { archivedAt: null },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/invoices/new");
  revalidatePath("/invoices/[id]", "page");
}

export async function getClient(id: string) {
  const userId = await getCurrentUserId();

  return db.client.findFirst({
    where: { id, userId },
    include: { invoices: true },
  });
}

export async function getClients(includeArchived = false) {
  const userId = await getCurrentUserId();

  return db.client.findMany({
    where: {
      userId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    include: { _count: { select: { invoices: true } } },
    orderBy: { name: "asc" },
  });
}
