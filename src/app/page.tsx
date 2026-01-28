import Link from "next/link";
import { getInvoices } from "./actions/invoices";
import { getClient } from "./actions/clients";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, calculateInvoiceTotal } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DollarSign, CheckCircle, AlertTriangle, Plus, X } from "lucide-react";

type Props = {
  searchParams: Promise<{ clientId?: string }>;
};

export default async function Dashboard({ searchParams }: Props) {
  const { clientId } = await searchParams;
  const invoices = await getInvoices(clientId);
  const filterClient = clientId ? await getClient(clientId) : null;

  const stats = {
    outstanding: invoices
      .filter((inv) => inv.status === "sent")
      .reduce((sum, inv) => sum + calculateInvoiceTotal(inv.lineItems), 0),
    paid: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + calculateInvoiceTotal(inv.lineItems), 0),
    overdue: invoices.filter(
      (inv) => inv.status === "sent" && new Date(inv.dueDate) < new Date()
    ).length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500">Manage and track your invoices</p>
          </div>
          <Link href="/invoices/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>

        {filterClient && (
          <div className="mb-6 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <span className="text-blue-800">
              Showing invoices for <strong>{filterClient.name}</strong>
            </span>
            <Link href="/" className="ml-auto text-blue-600 hover:text-blue-800">
              <X className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Outstanding"
            value={formatCurrency(stats.outstanding)}
            subtext={`${invoices.filter(inv => inv.status === "sent").length} invoices`}
            variant="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Paid"
            value={formatCurrency(stats.paid)}
            subtext={`${invoices.filter(inv => inv.status === "paid").length} invoices`}
            variant="green"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Overdue"
            value={String(stats.overdue)}
            subtext="invoices"
            variant="red"
          />
        </div>

        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No invoices yet. Create your first invoice to get started.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-blue-600">
                      <Link href={`/invoices/${invoice.id}/preview`}>
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(calculateInvoiceTotal(invoice.lineItems))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          invoice.status === 'sent' && new Date(invoice.dueDate) < new Date()
                            ? 'overdue'
                            : invoice.status as 'draft' | 'sent' | 'paid'
                        }
                      />
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/invoices/${invoice.id}/preview`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
