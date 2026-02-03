"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { invoiceSchema, invoiceStatusSchema, ActionResult, validationError } from "@/lib/schemas";

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
};

async function generateInvoiceNumber(): Promise<string> {
  const latest = await db.invoice.findFirst({
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  if (!latest) return "INV-001";

  const num = parseInt(latest.invoiceNumber.replace("INV-", ""), 10);
  return `INV-${String(num + 1).padStart(3, "0")}`;
}

export async function createInvoice(data: InvoiceInput): Promise<ActionResult<string>> {
  const validated = invoiceSchema.safeParse(data);
  if (!validated.success) {
    return validationError(validated.error);
  }

  const invoiceNumber = await generateInvoiceNumber();
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
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
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

  await db.lineItem.deleteMany({ where: { invoiceId: id } });

  await db.invoice.update({
    where: { id },
    data: {
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
  revalidatePath(`/invoices/${id}`);
  return { success: true, data: undefined };
}

export async function updateInvoiceStatus(id: string, status: string) {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.invoice.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Invoice not found");
  }

  const validated = invoiceStatusSchema.safeParse(status);
  if (!validated.success) {
    throw new Error("Status must be draft, sent, or paid");
  }

  await db.invoice.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  const userId = await getCurrentUserId();

  // Verify ownership
  const existing = await db.invoice.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Invoice not found");
  }

  await db.invoice.delete({ where: { id } });
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
