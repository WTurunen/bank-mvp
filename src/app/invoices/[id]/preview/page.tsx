import { notFound } from "next/navigation";
import { getInvoice } from "@/app/actions/invoices";
import { formatCurrency, formatDate, calculateInvoiceTotal } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePreviewPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    notFound();
  }

  const total = calculateInvoiceTotal(invoice.lineItems);

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 print:hidden">
          <PrintButton />
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">Your Company</h2>
              <p className="text-gray-600">123 Business Street</p>
              <p className="text-gray-600">City, State 12345</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Bill To
              </h3>
              <p className="font-medium text-gray-900">{invoice.clientName}</p>
              <p className="text-gray-600">{invoice.clientEmail}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-sm text-gray-500">Issue Date: </span>
                <span className="font-medium">
                  {formatDate(invoice.issueDate)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Due Date: </span>
                <span className="font-medium">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-sm font-semibold text-gray-600">
                  Description
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600">
                  Qty
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600">
                  Unit Price
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{item.description}</td>
                  <td className="py-3 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-t-2 border-gray-900">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Notes
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}
