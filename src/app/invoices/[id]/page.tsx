import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoiceForm } from "@/components/invoice-form";
import { getInvoice, updateInvoiceStatus, deleteInvoice } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const [invoice, clientsResult] = await Promise.all([
    getInvoice(id),
    getClients(false, { page: 1, pageSize: 100 }),
  ]);

  if (!invoice) {
    notFound();
  }

  const clients = clientsResult.data;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Back</Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <Badge className={statusColors[invoice.status]}>
              {invoice.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Link href={`/invoices/${invoice.id}/preview`}>
              <Button variant="outline">Preview</Button>
            </Link>
            {invoice.status === "draft" && (
              <form action={async () => {
                "use server";
                await updateInvoiceStatus(id, "sent");
              }}>
                <Button type="submit">Mark as Sent</Button>
              </form>
            )}
            {invoice.status === "sent" && (
              <form action={async () => {
                "use server";
                await updateInvoiceStatus(id, "paid");
              }}>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Mark as Paid
                </Button>
              </form>
            )}
            <form action={async () => {
              "use server";
              await deleteInvoice(id);
            }}>
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          </div>
        </div>
        <InvoiceForm key={invoice.updatedAt.toString()} invoice={invoice} clients={clients} />
      </div>
    </div>
  );
}
