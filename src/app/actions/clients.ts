"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { clientSchema, ActionResult, validationError } from "@/lib/schemas";
import { createLogger } from "@/lib/logger";
import {
  PaginationParams,
  PaginatedResult,
  DEFAULT_PAGE_SIZE,
  calculateSkipTake,
  calculatePaginationMeta,
} from "@/lib/pagination";

export type ClientInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export async function createClient(data: ClientInput): Promise<ActionResult<string>> {
  const userId = await getCurrentUserId();
  const log = createLogger({ action: "createClient", userId });

  const validated = clientSchema.safeParse(data);
  if (!validated.success) {
    return validationError(validated.error);
  }

  log.info({ clientName: data.name, clientEmail: data.email }, "Creating client");

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

    log.info({ clientId: client.id, clientName: client.name }, "Client created");
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
      log.warn({ email: data.email }, "Client with this email already exists");
      return { success: false, error: "A client with this email already exists", field: "email" };
    }
    log.error({ error }, "Failed to create client");
    throw error;
  }
}

export async function updateClient(id: string, data: ClientInput): Promise<ActionResult<void>> {
  const userId = await getCurrentUserId();
  const log = createLogger({ action: "updateClient", userId, clientId: id });

  // Verify ownership
  const existing = await db.client.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  const validated = clientSchema.safeParse(data);
  if (!validated.success) {
    return validationError(validated.error);
  }

  log.info({ clientName: data.name, clientEmail: data.email }, "Updating client");

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

    log.info({ clientName: data.name }, "Client updated");
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath("/invoices/new");
    revalidatePath("/invoices/[id]", "page");
    return { success: true, data: undefined };
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      log.warn({ email: data.email }, "Client with this email already exists");
      return { success: false, error: "A client with this email already exists", field: "email" };
    }
    log.error({ error }, "Failed to update client");
    throw error;
  }
}

export async function archiveClient(id: string): Promise<ActionResult<void>> {
  const userId = await getCurrentUserId();
  const log = createLogger({ action: "archiveClient", userId, clientId: id });

  // Verify ownership
  const existing = await db.client.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  log.info({ clientName: existing.name }, "Archiving client");

  await db.client.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  log.info({ clientName: existing.name }, "Client archived");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/invoices/new");
  revalidatePath("/invoices/[id]", "page");
  return { success: true, data: undefined };
}

export async function restoreClient(id: string): Promise<ActionResult<void>> {
  const userId = await getCurrentUserId();
  const log = createLogger({ action: "restoreClient", userId, clientId: id });

  // Verify ownership
  const existing = await db.client.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  log.info({ clientName: existing.name }, "Restoring client");

  await db.client.update({
    where: { id },
    data: { archivedAt: null },
  });

  log.info({ clientName: existing.name }, "Client restored");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/invoices/new");
  revalidatePath("/invoices/[id]", "page");
  return { success: true, data: undefined };
}

export async function getClient(id: string) {
  const userId = await getCurrentUserId();

  return db.client.findFirst({
    where: { id, userId },
    include: { invoices: true },
  });
}

export async function getClients(
  includeArchived = false,
  pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
) {
  const userId = await getCurrentUserId();
  const { skip, take } = calculateSkipTake(pagination);

  const where = {
    userId,
    ...(includeArchived ? {} : { archivedAt: null }),
  };

  const [clients, totalCount] = await Promise.all([
    db.client.findMany({
      where,
      include: { _count: { select: { invoices: true } } },
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    db.client.count({ where }),
  ]);

  return {
    data: clients,
    pagination: calculatePaginationMeta(totalCount, pagination),
  };
}
