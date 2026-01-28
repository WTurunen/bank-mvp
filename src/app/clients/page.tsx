"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Archive } from "lucide-react";
import { getClients, restoreClient } from "@/app/actions/clients";

type Client = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  archivedAt: Date | null;
  invoices: { id: string }[];
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClients() {
      setIsLoading(true);
      const data = await getClients(showArchived);
      setClients(data);
      setIsLoading(false);
    }
    loadClients();
  }, [showArchived]);

  const handleRestore = async (id: string) => {
    await restoreClient(id);
    const data = await getClients(showArchived);
    setClients(data);
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.companyName?.toLowerCase().includes(query) ?? false)
    );
  });

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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    {searchQuery
                      ? "No clients match your search."
                      : "No clients yet. Create your first client to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
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
                    <TableCell>{client.companyName ?? "—"}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone ?? "—"}</TableCell>
                    <TableCell>{client.invoices.length}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {client.archivedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(client.id)}
                        >
                          Restore
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="showArchived"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          <label htmlFor="showArchived" className="text-sm text-slate-600">
            Show archived clients
          </label>
        </div>
      </div>
    </div>
  );
}
