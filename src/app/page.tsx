import Link from "next/link";
import { getInvoices } from "./actions/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default async function Dashboard() {
  const invoices = await getInvoices();

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

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <Link href="/invoices/new">
            <Button>New Invoice</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.outstanding)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paid)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
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
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>
                      {formatCurrency(calculateInvoiceTotal(invoice.lineItems))}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
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
        </Card>
      </div>
    </div>
  );
}
