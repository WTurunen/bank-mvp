import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/clients">
            <Button variant="outline">Back</Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Client</h1>
        </div>
        <ClientForm />
      </div>
    </div>
  );
}
