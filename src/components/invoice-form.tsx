"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { createInvoice, updateInvoice } from "@/app/actions/invoices";

// Only allow digits, comma, and dot
const isValidNumericInput = (value: string) => /^[\d.,]*$/.test(value);

// Parse number, treating comma as decimal separator
const parseNum = (val: string) => {
  const normalized = val.replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

// Validate that string represents a valid number
const isValidNumber = (val: string) => {
  if (!val || val === "") return true; // Empty is ok, will default to 0
  const normalized = val.replace(",", ".");
  return !isNaN(parseFloat(normalized));
};

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceProp = {
  id: string;
  clientName: string;
  clientEmail: string;
  dueDate: Date;
  notes: string | null;
  lineItems: { id: string; description: string; quantity: number; unitPrice: number }[];
};

type Props = {
  invoice?: InvoiceProp;
};

// Calculate default due date outside component to avoid React purity rule violation
const getDefaultDueDate = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export function InvoiceForm({ invoice }: Props) {
  const [clientName, setClientName] = useState(invoice?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? "");
  const [dueDate, setDueDate] = useState(() =>
    invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().split("T")[0]
      : getDefaultDueDate()
  );
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })) ?? [
      { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" },
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    // For numeric fields, only allow valid numeric characters
    if ((field === "quantity" || field === "unitPrice") && !isValidNumericInput(value)) {
      return; // Reject invalid input
    }
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setError(null); // Clear error when user types
  };

  const total = lineItems.reduce(
    (sum, item) => sum + parseNum(item.quantity) * parseNum(item.unitPrice),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all numeric fields
    for (const item of lineItems) {
      if (!isValidNumber(item.quantity)) {
        setError(`Invalid quantity: "${item.quantity}". Use only numbers, comma or dot.`);
        return;
      }
      if (!isValidNumber(item.unitPrice)) {
        setError(`Invalid unit price: "${item.unitPrice}". Use only numbers, comma or dot.`);
        return;
      }
    }

    // Validate at least one line item has values
    const hasValidLineItem = lineItems.some(
      (item) => item.description && parseNum(item.unitPrice) > 0
    );
    if (!hasValidLineItem) {
      setError("Please add at least one line item with a description and price.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        clientName,
        clientEmail,
        dueDate,
        notes,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: parseNum(item.quantity),
          unitPrice: parseNum(item.unitPrice),
        })),
      };

      if (invoice) {
        await updateInvoice(invoice.id, data);
        router.push(`/invoices/${invoice.id}`);
      } else {
        await createInvoice(data);
        // createInvoice redirects internally, but if it doesn't:
        router.push("/");
      }
    } catch (err) {
      // Next.js redirect() throws an error with digest containing "NEXT_REDIRECT"
      // Re-throw it so Next.js can handle the redirect
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Failed to save invoice. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 items-end"
            >
              <div className="col-span-5 space-y-2">
                {index === 0 && <Label>Description</Label>}
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                  placeholder="Service or product description"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                {index === 0 && <Label>Qty</Label>}
                <Input
                  type="text"
                  inputMode="numeric"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, "quantity", e.target.value)
                  }
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                {index === 0 && <Label>Unit Price</Label>}
                <Input
                  type="text"
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateLineItem(item.id, "unitPrice", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-2 space-y-2">
                {index === 0 && <Label>Total</Label>}
                <div className="h-9 flex items-center font-medium">
                  {formatCurrency(parseNum(item.quantity) * parseNum(item.unitPrice))}
                </div>
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                >
                  X
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addLineItem}>
            + Add Line Item
          </Button>
          <div className="flex justify-end pt-4 border-t">
            <div className="text-xl font-bold">
              Total: {formatCurrency(total)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, additional notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : invoice
            ? "Update Invoice"
            : "Create Invoice"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
