import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientForm } from "@/components/client-form";
import { getClient } from "@/app/actions/clients";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  const clientData = {
    id: client.id,
    name: client.name,
    email: client.email,
    companyName: client.companyName,
    phone: client.phone,
    address: client.address,
    archivedAt: client.archivedAt,
    invoiceCount: client.invoices.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/clients">
            <Button variant="outline">Back</Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {client.name}
          </h1>
          {client.archivedAt && (
            <Badge className="bg-gray-100 text-gray-800">
              Archived
            </Badge>
          )}
        </div>
        <ClientForm key={client.updatedAt.toString()} client={clientData} />
      </div>
    </div>
  );
}
