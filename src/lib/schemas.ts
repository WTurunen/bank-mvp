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
