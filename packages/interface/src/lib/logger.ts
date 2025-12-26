/**
 * Simple logging utility that can be disabled in production.
 * 
 * In production, only warnings and errors are logged.
 * In development, all log levels are enabled.
 */

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function shouldLog(level: LogLevel): boolean {
  if (!isProd) return true;
  // In production, only log warnings and errors
  return level === "warn" || level === "error";
}

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) {
      console.debug("[DEBUG]", ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) {
      console.error("[ERROR]", ...args);
    }
  },
};

