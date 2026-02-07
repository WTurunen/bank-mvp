import { db } from "@/lib/db";

/**
 * Atomically generates the next invoice number using database counter.
 * Uses UPDATE ... RETURNING for atomic increment.
 */
export async function getNextInvoiceNumber(userId: string): Promise<string> {
  // Use raw SQL for atomic increment
  const result = await db.$queryRaw<{ counter: number }[]>`
    UPDATE "InvoiceCounter"
    SET counter = counter + 1, "updatedAt" = NOW()
    WHERE id = ${userId}
    RETURNING counter
  `;

  if (result.length === 0) {
    // Counter doesn't exist for this user, create it atomically
    await db.$executeRaw`
      INSERT INTO "InvoiceCounter" (id, counter, "updatedAt")
      VALUES (${userId}, 1, NOW())
      ON CONFLICT (id) DO UPDATE SET counter = "InvoiceCounter".counter + 1, "updatedAt" = NOW()
    `;

    const newResult = await db.$queryRaw<{ counter: number }[]>`
      SELECT counter FROM "InvoiceCounter" WHERE id = ${userId}
    `;

    if (newResult.length === 0) {
      throw new Error("Failed to initialize invoice counter");
    }

    return formatInvoiceNumber(newResult[0].counter);
  }

  return formatInvoiceNumber(result[0].counter);
}

function formatInvoiceNumber(counter: number): string {
  return `INV-${String(counter).padStart(3, "0")}`;
}
