import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  base: {
    env: process.env.NODE_ENV,
  },
});

export type LogContext = {
  userId?: string;
  action?: string;
  invoiceId?: string;
  clientId?: string;
  [key: string]: unknown;
};

export function createLogger(context: LogContext) {
  return logger.child(context);
}

export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string
) {
  const log = createLogger({ userId });
  if (statusCode >= 500) {
    log.error({ method, path, statusCode, durationMs }, "Request failed");
  } else if (statusCode >= 400) {
    log.warn({ method, path, statusCode, durationMs }, "Request client error");
  } else {
    log.info({ method, path, statusCode, durationMs }, "Request completed");
  }
}

export function logError(
  error: unknown,
  context: LogContext & { message?: string }
) {
  const log = createLogger(context);
  if (error instanceof Error) {
    log.error(
      { errorName: error.name, errorMessage: error.message, stack: error.stack },
      context.message || "An error occurred"
    );
  } else {
    log.error({ error }, context.message || "An unknown error occurred");
  }
}
