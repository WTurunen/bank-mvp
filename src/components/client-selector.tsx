"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
};

type Props = {
  clients: Client[];
  onSelect: (client: Client) => void;
  value?: string;
};

export function ClientSelector({ clients, onSelect, value }: Props) {
  const selectedClient = value ? clients.find((c) => c.id === value) : null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const client = clients.find((c) => c.id === e.target.value);
    if (client) {
      onSelect(client);
    }
  };

  if (clients.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">No clients yet. Create one to get started.</p>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus className="w-4 h-4" />
          Create a new client
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        id="client-selector"
        aria-label="Select client"
        value={value ?? ""}
        onChange={handleChange}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        <option value="" disabled>
          Select a client...
        </option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.email})
          </option>
        ))}
      </select>

      {selectedClient && (
        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
          <div className="font-medium text-slate-900">{selectedClient.name}</div>
          {selectedClient.companyName && (
            <div className="text-slate-600">{selectedClient.companyName}</div>
          )}
          <div className="text-slate-500">{selectedClient.email}</div>
          {selectedClient.phone && (
            <div className="text-slate-500">{selectedClient.phone}</div>
          )}
          {selectedClient.address && (
            <div className="text-slate-500 whitespace-pre-line">{selectedClient.address}</div>
          )}
        </div>
      )}

      <Link
        href="/clients/new"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
      >
        <Plus className="w-4 h-4" />
        Create a new client
      </Link>
    </div>
  );
}
