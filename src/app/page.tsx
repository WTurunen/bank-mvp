import Link from "next/link";
import { getInvoicesList, getDashboardStats, type InvoiceListItem } from "./actions/invoices";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DollarSign, CheckCircle, AlertTriangle, Plus, X } from "lucide-react";
import { parsePaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/pagination";

type Props = {
  searchParams: Promise<{ clientId?: string; page?: string; showArchived?: string }>;
};

export default async function Dashboard({ searchParams }: Props) {
  const params = await searchParams;
  const pagination = parsePaginationParams(params);
  const showArchived = params.showArchived === "true";
  const [{ data: invoices, pagination: paginationMeta }, stats, filterClient] = await Promise.all([
    getInvoicesList(params.clientId, pagination, showArchived),
    getDashboardStats(),
    params.clientId ? getClient(params.clientId) : null,
  ]);

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
            value={formatCurrency(stats.totalOutstanding)}
            subtext={`${stats.invoiceCount} invoices`}
            variant="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Paid"
            value={formatCurrency(stats.totalPaid)}
            subtext="total"
            variant="green"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Overdue"
            value={String(stats.overdueCount)}
            subtext={stats.overdueCount > 0 ? formatCurrency(stats.totalOverdue) : "none"}
            variant="red"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-slate-700">
            {showArchived ? "All invoices (including archived)" : "Active invoices"}
          </h2>
          <Link
            href={showArchived ? "/" : "/?showArchived=true"}
            className="text-sm text-blue-600 hover:underline"
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Link>
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
                invoices.map((invoice: InvoiceListItem) => (
                  <TableRow key={invoice.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-blue-600">
                      <Link href={`/invoices/${invoice.id}/preview`}>
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(invoice.total)}
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
          <Pagination pagination={paginationMeta} />
        </div>
      </div>
    </div>
  );
}
