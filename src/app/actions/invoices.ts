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
  clientName: string;
  clientEmail: string;
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
      clientName: data.clientName,
      clientEmail: data.clientEmail,
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
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(id: string, data: InvoiceInput) {
  await db.lineItem.deleteMany({ where: { invoiceId: id } });

  await db.invoice.update({
    where: { id },
    data: {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
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
  redirect(`/invoices/${id}`);
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

export async function getInvoices() {
  return db.invoice.findMany({
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });
}
