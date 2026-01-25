"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { createInvoice, updateInvoice } from "@/app/actions/invoices";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Invoice = {
  id: string;
  clientName: string;
  clientEmail: string;
  dueDate: Date;
  notes: string | null;
  lineItems: LineItem[];
};

type Props = {
  invoice?: Invoice;
};

export function InvoiceForm({ invoice }: Props) {
  const [clientName, setClientName] = useState(invoice?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? "");
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
  );
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems ?? [
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      clientName,
      clientEmail,
      dueDate,
      notes,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (invoice) {
      await updateInvoice(invoice.id, data);
    } else {
      await createInvoice(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                {index === 0 && <Label>Unit Price</Label>}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                {index === 0 && <Label>Total</Label>}
                <div className="h-9 flex items-center font-medium">
                  {formatCurrency(item.quantity * item.unitPrice)}
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
      </div>
    </form>
  );
}
