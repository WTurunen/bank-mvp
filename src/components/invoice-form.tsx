"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createInvoice, updateInvoice } from "@/app/actions/invoices";
import {
  validateLineItemNumeric,
  validateLineItemPrice,
  validateHasCompleteLineItem,
  VALIDATION_MESSAGES,
} from "@/lib/validation";
import { ClientSelector } from "@/components/client-selector";

// Only allow digits, comma, and dot
const isValidNumericInput = (value: string) => /^[\d.,]*$/.test(value);

// Parse number, treating comma as decimal separator
const parseNum = (val: string) => {
  const normalized = val.replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
};

type InvoiceProp = {
  id: string;
  clientId?: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientAddress?: string | null;
  dueDate: Date;
  notes: string | null;
  lineItems: { id: string; description: string; quantity: number; unitPrice: number }[];
};

type Props = {
  invoice?: InvoiceProp;
  clients?: Client[];
};

// Calculate default due date outside component to avoid React purity rule violation
const getDefaultDueDate = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export function InvoiceForm({ invoice, clients }: Props) {
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    invoice?.clientId ?? undefined
  );
  const [clientSnapshot, setClientSnapshot] = useState<{
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  } | null>(
    invoice
      ? {
          name: invoice.clientName,
          email: invoice.clientEmail,
          phone: invoice.clientPhone ?? null,
          address: invoice.clientAddress ?? null,
        }
      : null
  );

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

  const handleClientSelect = (client: Client) => {
    setSelectedClientId(client.id);
    setClientSnapshot({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    });
    setError(null);
  };

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

    // Validate client selection when clients are provided
    if (clients && !selectedClientId) {
      setError("Please select a client for this invoice.");
      return;
    }

    // Validate all numeric fields using centralized validation
    for (const item of lineItems) {
      const quantity = parseNum(item.quantity);
      const unitPrice = parseNum(item.unitPrice);

      // Check if values can be parsed as numbers
      const quantityNumericResult = validateLineItemNumeric(
        item.quantity === "" ? 0 : quantity
      );
      if (!quantityNumericResult.valid) {
        setError(`Invalid quantity: "${item.quantity}". ${VALIDATION_MESSAGES.VALUE_NOT_NUMERIC}`);
        return;
      }

      const priceNumericResult = validateLineItemNumeric(
        item.unitPrice === "" ? 0 : unitPrice
      );
      if (!priceNumericResult.valid) {
        setError(`Invalid unit price: "${item.unitPrice}". ${VALIDATION_MESSAGES.VALUE_NOT_NUMERIC}`);
        return;
      }

      // Validate price is non-negative
      const priceResult = validateLineItemPrice(unitPrice);
      if (!priceResult.valid) {
        setError(priceResult.message);
        return;
      }
    }

    // Validate at least one line item has description and positive price
    const parsedLineItems = lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: parseNum(item.quantity),
      unitPrice: parseNum(item.unitPrice),
    }));
    const completeLineItemResult = validateHasCompleteLineItem(parsedLineItems);
    if (!completeLineItemResult.valid) {
      setError(completeLineItemResult.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        clientId: selectedClientId,
        clientName: clientSnapshot?.name ?? "",
        clientEmail: clientSnapshot?.email ?? "",
        clientPhone: clientSnapshot?.phone ?? null,
        clientAddress: clientSnapshot?.address ?? null,
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
        router.refresh();
      } else {
        const newId = await createInvoice(data);
        router.push(`/invoices/${newId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <section className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg p-6">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
          Client Information
        </h2>
        <div className="space-y-4">
          {clients ? (
            <>
              <div className="space-y-2">
                <Label>Client <span className="text-slate-400 font-normal">(required)</span></Label>
                <ClientSelector
                  clients={clients}
                  onSelect={handleClientSelect}
                  value={selectedClientId}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name <span className="text-slate-400 font-normal">(required)</span></Label>
                <Input
                  id="clientName"
                  value={clientSnapshot?.name ?? ""}
                  onChange={(e) => setClientSnapshot(prev => ({
                    name: e.target.value,
                    email: prev?.email ?? "",
                    phone: prev?.phone ?? null,
                    address: prev?.address ?? null,
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email <span className="text-slate-400 font-normal">(required)</span></Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientSnapshot?.email ?? ""}
                  onChange={(e) => setClientSnapshot(prev => ({
                    name: prev?.name ?? "",
                    email: e.target.value,
                    phone: prev?.phone ?? null,
                    address: prev?.address ?? null,
                  }))}
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date <span className="text-slate-400 font-normal">(required)</span></Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg p-6">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
          Line Items
        </h2>
        <div className="space-y-4">
          <div className="hidden md:grid md:grid-cols-12 gap-4 mb-2 text-sm font-medium text-slate-500">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="bg-slate-50 rounded-lg p-4 md:p-0 md:bg-transparent md:rounded-none">
                {/* Mobile: show labels, stack vertically */}
                <div className="md:hidden space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-700">Line Item {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-50"
                      aria-label="Remove line item"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, "description", e.target.value)
                      }
                      placeholder="Service or product"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Qty</Label>
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
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Price</Label>
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
                  </div>
                  <div className="text-right font-medium text-slate-900">
                    Total: {formatCurrency(parseNum(item.quantity) * parseNum(item.unitPrice))}
                  </div>
                </div>

                {/* Desktop: grid row */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, "description", e.target.value)
                      }
                      placeholder="Service or product description"
                      required
                    />
                  </div>
                  <div className="col-span-2">
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
                  <div className="col-span-2">
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
                  <div className="col-span-2 font-medium tabular-nums">
                    {formatCurrency(parseNum(item.quantity) * parseNum(item.unitPrice))}
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Remove line item"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addLineItem} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Line Item
          </Button>

          <div className="flex justify-end pt-4 border-t">
            <div className="text-xl font-bold">
              Total: {formatCurrency(total)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg p-6">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
          Notes <span className="normal-case font-normal">(optional)</span>
        </h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, additional notes..."
          rows={3}
        />
      </section>

      <div className="flex flex-col-reverse md:flex-row gap-4">
        <Button type="button" variant="outline" asChild className="md:order-1">
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white md:order-2">
          {isSubmitting ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
