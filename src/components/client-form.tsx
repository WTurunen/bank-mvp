"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Archive } from "lucide-react";
import { createClient, updateClient, archiveClient } from "@/app/actions/clients";
import { validateClient } from "@/lib/clients-validation";

type ClientProp = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  archivedAt: Date | null;
  invoiceCount: number;
};

type Props = {
  client?: ClientProp;
};

export function ClientForm({ client }: Props) {
  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [companyName, setCompanyName] = useState(client?.companyName ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (
    setter: (val: string) => void,
    value: string
  ) => {
    setter(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateClient({ name, email, companyName, phone, address });
    if (validationErrors.length > 0) {
      setError(validationErrors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        name,
        email,
        companyName: companyName || undefined,
        phone: phone || undefined,
        address: address || undefined,
      };

      if (client) {
        await updateClient(client.id, data);
        router.refresh();
      } else {
        await createClient(data);
        router.push("/clients");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!client) return;

    setIsSubmitting(true);
    try {
      await archiveClient(client.id);
      router.push("/clients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-slate-400 font-normal">(required)</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleInputChange(setName, e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-slate-400 font-normal">(required)</span></Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => handleInputChange(setEmail, e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => handleInputChange(setCompanyName, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handleInputChange(setPhone, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => handleInputChange(setAddress, e.target.value)}
              placeholder="Street address, city, postal code..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {client && client.invoiceCount > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm">
            This client has {client.invoiceCount} invoice{client.invoiceCount === 1 ? "" : "s"}.
            Archiving will hide the client from selection but preserve invoice history.
          </p>
        </section>
      )}

      <div className="flex flex-col-reverse md:flex-row gap-4">
        <Button type="button" variant="outline" asChild className="md:order-1">
          <Link href="/clients">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white md:order-2">
          {isSubmitting ? "Saving..." : client ? "Update Client" : "Create Client"}
        </Button>
        {client && (
          <Button
            type="button"
            variant="outline"
            onClick={handleArchive}
            disabled={isSubmitting}
            className="text-amber-600 border-amber-300 hover:bg-amber-50 md:order-3 md:ml-auto"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Client
          </Button>
        )}
      </div>
    </form>
  );
}
