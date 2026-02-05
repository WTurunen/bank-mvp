"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { invoiceSchema, invoiceStatusSchema, ActionResult, validationError } from "@/lib/schemas";
import { withTransaction } from "@/lib/transaction";
import { getNextInvoiceNumber } from "@/lib/invoice-number";
import { Prisma } from "@prisma/client";

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceInput = {
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientAddress?: string | null;
  dueDate: string;
  notes?: string;
  lineItems: LineItemInput[];
  version?: number;
};

export async function createInvoice(data: InvoiceInput): Promise<ActionResult<string>> {
  const validated = invoiceSchema.safeParse(data);
  if (!validated.success) {
    return validationError(validated.error);
  }

  const userId = await getCurrentUserId();

  // Verify client ownership if clientId is provided
  if (data.clientId) {
    const client = await db.client.findFirst({
      where: { id: data.clientId, userId },
    });
    if (!client) {
      return { success: false, error: "Client not found" };
    }
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const invoiceNumber = await getNextInvoiceNumber(userId);

      const invoice = await db.invoice.create({
        data: {
          userId,
          invoiceNumber,
          clientId: data.clientId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          clientAddress: data.clientAddress,
          dueDate: new Date(data.dueDate),
          notes: data.notes || null,
          lineItems: {
            create: data.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      revalidatePath("/");
      return { success: true, data: invoice.id };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is a unique constraint violation (P2002)
      const isUniqueConstraintViolation =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isUniqueConstraintViolation || attempt === MAX_RETRIES) {
        console.error("Failed to create invoice:", lastError);
        return {
          success: false,
          error: "Failed to create invoice. Please try again.",
        };
      }

      console.warn(
        `Invoice creation attempt ${attempt}/${MAX_RETRIES} failed due to unique constraint, retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }

  console.error("Failed to create invoice after retries:", lastError);
  return {
    success: false,
    error: "Failed to create invoice. Please try again.",
  };
}

export async function updateInvoice(id: string, data: InvoiceInput): Promise<ActionResult<void>> {
  const validated = invoiceSchema.safeParse(data);
  if (!validated.success) {
    return validationError(validated.error);
  }

  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.invoice.findFirst({
    where: { id, userId },
    select: { id: true, version: true },
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Check optimistic locking version
  if (data.version !== undefined && data.version !== existing.version) {
    return {
      success: false,
      error: "Invoice has been modified by another user. Please refresh and try again.",
    };
  }

  // Verify client ownership if clientId is provided
  if (data.clientId) {
    const client = await db.client.findFirst({
      where: { id: data.clientId, userId },
    });
    if (!client) {
      return { success: false, error: "Client not found" };
    }
  }

  try {
    await withTransaction(async (tx) => {
      // Double-check version inside transaction
      const current = await tx.invoice.findUnique({
        where: { id },
        select: { version: true },
      });

      if (!current || (data.version !== undefined && current.version !== data.version)) {
        throw new Error("VERSION_MISMATCH");
      }

      // Delete existing line items
      await tx.lineItem.deleteMany({ where: { invoiceId: id } });

      // Update invoice with new data and increment version
      await tx.invoice.update({
        where: { id },
        data: {
          clientId: data.clientId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          clientAddress: data.clientAddress,
          dueDate: new Date(data.dueDate),
          notes: data.notes || null,
          version: { increment: 1 },
          lineItems: {
            create: data.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });
    });

    revalidatePath("/");
    revalidatePath(`/invoices/${id}`);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_MISMATCH") {
      return {
        success: false,
        error: "Invoice has been modified by another user. Please refresh and try again.",
      };
    }

    console.error("Failed to update invoice:", error);
    return {
      success: false,
      error: "Failed to update invoice. Please try again.",
    };
  }
}

export async function updateInvoiceStatus(id: string, status: string): Promise<ActionResult<void>> {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.invoice.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  const validated = invoiceStatusSchema.safeParse(status);
  if (!validated.success) {
    return { success: false, error: "Status must be draft, sent, or paid" };
  }

  await db.invoice.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
  return { success: true, data: undefined };
}

export async function deleteInvoice(id: string): Promise<ActionResult<void>> {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.invoice.findFirst({
    where: { id, userId },
    select: { id: true, invoiceNumber: true, status: true },
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Prevent deletion of paid invoices
  if (existing.status === "paid") {
    return { success: false, error: "Cannot delete a paid invoice" };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.lineItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });
    });
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return {
      success: false,
      error: "Failed to delete invoice. Please try again.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

export async function getInvoices(clientId?: string) {
  const userId = await getCurrentUserId();

  const invoices = await db.invoice.findMany({
    where: {
      userId,
      ...(clientId ? { clientId } : {}),
    },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((invoice) => ({
    ...invoice,
    lineItems: invoice.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
    })),
  }));
}

export async function getInvoice(id: string) {
  const userId = await getCurrentUserId();

  const invoice = await db.invoice.findFirst({
    where: { id, userId },
    include: { lineItems: true },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    lineItems: invoice.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
    })),
  };
}
