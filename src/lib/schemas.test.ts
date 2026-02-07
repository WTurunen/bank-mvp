import { describe, it, expect } from "vitest";
import {
  invoiceSchema,
  lineItemSchema,
  invoiceStatusSchema,
  clientSchema,
  validationError,
} from "./schemas";
import { z } from "zod";

describe("lineItemSchema", () => {
  it("accepts valid line item", () => {
    const result = lineItemSchema.safeParse({
      description: "Web development",
      quantity: 10,
      unitPrice: 150,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = lineItemSchema.safeParse({
      description: "",
      quantity: 1,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = lineItemSchema.safeParse({
      description: "Service",
      quantity: 0,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = lineItemSchema.safeParse({
      description: "Service",
      quantity: -1,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = lineItemSchema.safeParse({
      description: "Service",
      quantity: 1,
      unitPrice: -50,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero price", () => {
    const result = lineItemSchema.safeParse({
      description: "Free consultation",
      quantity: 1,
      unitPrice: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects quantity exceeding max", () => {
    const result = lineItemSchema.safeParse({
      description: "Service",
      quantity: 1000000,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding max length", () => {
    const result = lineItemSchema.safeParse({
      description: "a".repeat(501),
      quantity: 1,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("invoiceSchema", () => {
  const validInvoice = {
    clientName: "John Doe",
    clientEmail: "john@example.com",
    dueDate: "2024-12-31",
    lineItems: [{ description: "Service", quantity: 1, unitPrice: 100 }],
  };

  it("accepts valid invoice", () => {
    const result = invoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("rejects missing client name", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid client email", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty line items", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      lineItems: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      notes: "Payment due on delivery",
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding max length", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional clientId", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientId: "some-id",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional clientPhone and clientAddress", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientPhone: "+1-555-123-4567",
      clientAddress: "123 Main St",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null clientPhone", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientPhone: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing due date", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      dueDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects clientName exceeding max length", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientName: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects clientEmail exceeding max length", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      clientEmail: "a".repeat(250) + "@test.com",
    });
    expect(result.success).toBe(false);
  });

  it("validates line items within invoice", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      lineItems: [{ description: "", quantity: -1, unitPrice: -50 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple line items", () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      lineItems: [
        { description: "Service A", quantity: 1, unitPrice: 100 },
        { description: "Service B", quantity: 2, unitPrice: 200 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("invoiceStatusSchema", () => {
  it("accepts draft status", () => {
    const result = invoiceStatusSchema.safeParse("draft");
    expect(result.success).toBe(true);
  });

  it("accepts sent status", () => {
    const result = invoiceStatusSchema.safeParse("sent");
    expect(result.success).toBe(true);
  });

  it("accepts paid status", () => {
    const result = invoiceStatusSchema.safeParse("paid");
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = invoiceStatusSchema.safeParse("cancelled");
    expect(result.success).toBe(false);
  });

  it("rejects empty status", () => {
    const result = invoiceStatusSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("accepts valid client", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "contact@acme.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts client with all optional fields", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "contact@acme.com",
      phone: "+1-555-123-4567",
      address: "123 Main St, City, State 12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = clientSchema.safeParse({
      name: "",
      email: "contact@acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length", () => {
    const result = clientSchema.safeParse({
      name: "a".repeat(201),
      email: "contact@acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "not-valid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects email exceeding max length", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "a".repeat(250) + "@test.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null phone", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "contact@acme.com",
      phone: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null address", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "contact@acme.com",
      address: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects phone exceeding max length", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "contact@acme.com",
      phone: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects address exceeding max length", () => {
    const result = clientSchema.safeParse({
      name: "Acme Corp",
      email: "contact@acme.com",
      address: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("validationError", () => {
  it("extracts first error message and field path", () => {
    const schema = z.object({ name: z.string().min(1, "Name is required") });
    const parseResult = schema.safeParse({ name: "" });
    if (!parseResult.success) {
      const result = validationError(parseResult.error);
      expect(result).toEqual({
        success: false,
        error: "Name is required",
        field: "name",
      });
    }
  });

  it("joins nested field paths with dots", () => {
    const schema = z.object({
      address: z.object({
        city: z.string().min(1, "City is required"),
      }),
    });
    const parseResult = schema.safeParse({ address: { city: "" } });
    if (!parseResult.success) {
      const result = validationError(parseResult.error);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.field).toBe("address.city");
      }
    }
  });
});
