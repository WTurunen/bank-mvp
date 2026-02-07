import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Archive } from "lucide-react";
import { getClients } from "@/app/actions/clients";
import { Pagination } from "@/components/pagination";
import { parsePaginationParams } from "@/lib/pagination";
import { ClientsPageClient } from "@/components/clients-page-client";
import { ArchivedToggle } from "@/components/archived-toggle";

type Props = {
  searchParams: Promise<{ page?: string; archived?: string }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const pagination = parsePaginationParams(params);
  const includeArchived = params.archived === "true";
  const { data: clients, pagination: paginationMeta } = await getClients(
    includeArchived,
    pagination
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500">Manage your client database</p>
          </div>
          <Link href="/clients/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Button>
          </Link>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No clients yet. Create your first client to get started.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className={`hover:bg-slate-50 ${client.archivedAt ? "opacity-60" : ""}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.name}
                        </Link>
                        {client.archivedAt && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="w-3 h-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone ?? "—"}</TableCell>
                    <TableCell>
                      {client._count.invoices > 0 ? (
                        <Link
                          href={`/?clientId=${client.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client._count.invoices}
                        </Link>
                      ) : (
                        client._count.invoices
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {client.archivedAt && (
                        <ClientsPageClient clientId={client.id} includeArchived={includeArchived} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination pagination={paginationMeta} />
        </div>

        <ArchivedToggle checked={includeArchived} />
      </div>
    </div>
  );
}
