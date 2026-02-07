import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/invoice-form";
import { getClients } from "@/app/actions/clients";

export default async function NewInvoicePage() {
  const { data: clients } = await getClients(false, { page: 1, pageSize: 100 });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline">Back</Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
        </div>
        <InvoiceForm clients={clients} />
      </div>
    </div>
  );
}
