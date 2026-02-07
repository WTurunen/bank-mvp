import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type TransactionCallback<T> = (tx: TransactionClient) => Promise<T>;

export type TransactionOptions = {
  maxRetries?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

const DEFAULT_OPTIONS: Required<TransactionOptions> = {
  maxRetries: 3,
  timeout: 5000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

export async function withTransaction<T>(
  callback: TransactionCallback<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await db.$transaction(callback, {
        timeout: opts.timeout,
        isolationLevel: opts.isolationLevel,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034"].includes(error.code);

      if (!isRetryable || attempt === opts.maxRetries) {
        throw lastError;
      }

      console.warn(`Transaction attempt ${attempt}/${opts.maxRetries} failed, retrying...`);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 100)
      );
    }
  }

  throw lastError || new Error("Transaction failed");
}
