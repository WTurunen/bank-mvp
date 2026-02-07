"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ArchivedToggleProps = {
  checked: boolean;
};

export function ArchivedToggle({ checked }: ArchivedToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.checked) {
      params.set("archived", "true");
    } else {
      params.delete("archived");
    }
    params.delete("page"); // Reset to first page when toggling
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="checkbox"
        id="showArchived"
        checked={checked}
        onChange={handleToggle}
        className="rounded border-slate-300"
      />
      <label htmlFor="showArchived" className="text-sm text-slate-600 cursor-pointer">
        Show archived clients
      </label>
    </div>
  );
}
