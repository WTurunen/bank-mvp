"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { restoreClient } from "@/app/actions/clients";

type RestoreButtonProps = {
  clientId: string;
  includeArchived: boolean;
};

export function ClientsPageClient({ clientId, includeArchived }: RestoreButtonProps) {
  const router = useRouter();

  const handleRestore = async () => {
    await restoreClient(clientId);
    router.refresh();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRestore}>
      Restore
    </Button>
  );
}
