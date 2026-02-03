import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(254, "Email must be 254 characters or less"),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
});

export type ClientSchema = z.infer<typeof clientSchema>;

export const lineItemSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less"),
  quantity: z
    .number()
    .positive("Quantity must be greater than zero")
    .max(999999, "Quantity is too large"),
  unitPrice: z
    .number()
    .min(0, "Price cannot be negative")
    .max(999999999, "Price is too large"),
});

export type LineItemSchema = z.infer<typeof lineItemSchema>;

export const invoiceSchema = z.object({
  clientId: z.string().optional(),
  clientName: z
    .string()
    .min(1, "Client name is required")
    .max(200, "Client name must be 200 characters or less"),
  clientEmail: z
    .string()
    .min(1, "Client email is required")
    .email("Invalid client email format")
    .max(254, "Client email must be 254 characters or less"),
  clientPhone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  clientAddress: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or less")
    .optional()
    .nullable(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
});

export type InvoiceSchema = z.infer<typeof invoiceSchema>;

export const VALID_STATUSES = ["draft", "sent", "paid"] as const;

export const invoiceStatusSchema = z.enum(VALID_STATUSES, {
  message: "Status must be draft, sent, or paid",
});

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
