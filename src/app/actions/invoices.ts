"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const count = await db.invoice.count();
  return `INV-${String(count + 1).padStart(3, "0")}`;
}

export async function createInvoice(data: InvoiceInput) {
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await db.invoice.create({
    data: {
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
  return invoice.id;
}

export async function updateInvoice(id: string, data: InvoiceInput) {
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
}

export async function updateInvoiceStatus(id: string, status: string) {
  await db.invoice.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  await db.invoice.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function getInvoices(clientId?: string) {
  const invoices = await db.invoice.findMany({
    where: clientId ? { clientId } : {},
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
  const invoice = await db.invoice.findUnique({
    where: { id },
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
