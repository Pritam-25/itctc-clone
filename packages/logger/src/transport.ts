import pretty from "pino-pretty";

const RESET = "\x1b[0m";
const SERVICE_COLOR = "\x1b[38;5;208m"; // Orange
const MODULE_COLOR = "\x1b[90m"; // Gray
const MESSAGE_COLOR = "\x1b[34m"; // Blue

const statusColor = (status: number) => {
  if (status >= 500) return "\x1b[41m\x1b[37m"; // Red BG, White FG
  if (status >= 400) return "\x1b[43m\x1b[30m"; // Yellow BG, Black FG
  if (status >= 300) return "\x1b[46m\x1b[37m"; // Cyan BG, White FG
  return "\x1b[42m\x1b[30m"; // Green BG, Black FG
};

const methodColor = (method: string) => {
  switch (method?.toUpperCase()) {
    case "GET":
      return "\x1b[48;5;18m\x1b[37m"; // Dark Navy Blue
    case "POST":
      return "\x1b[44m\x1b[37m"; // Blue BG, White FG
    case "PUT":
      return "\x1b[48;5;214m\x1b[30m"; // Orange
    case "PATCH":
      return "\x1b[42m\x1b[30m"; // Green BG, Black FG
    case "DELETE":
      return "\x1b[41m\x1b[37m"; // Red BG, White FG
    default:
      return RESET;
  }
};

const durationColor = "\x1b[47m\x1b[30m"; // White BG, Black FG

const METHOD_WIDTH = 7;
const STATUS_WIDTH = 3;
const DURATION_WIDTH = 8;
const REMOTE_ADDR_WIDTH = 15;

export default (opts: Record<string, unknown>) =>
  pretty({
    ...opts,
    colorize: true,
    translateTime: "SYS:yyyy-mm-dd - HH:MM:ss",
    messageFormat: (log) => {
      const moduleName = typeof log.module === "string" ? log.module : "app";

      if (log.module !== "http") {
        return `${SERVICE_COLOR}[${log.service}]${RESET} ${MODULE_COLOR}[${moduleName}]${RESET} ${MESSAGE_COLOR}${log.message}${RESET}`;
      }

      const code = Number(log.statusCode ?? 200);
      const method = String(log.method ?? "GET");
      const duration = `${log.durationMs}ms`;
      const remoteAddress = String(log.remoteAddress ?? "unknown");

      // Padding for fixed width blocks
      const paddedMethod = ` ${method.toUpperCase().padEnd(METHOD_WIDTH, " ")} `;
      const paddedStatus = ` ${code.toString().padStart(STATUS_WIDTH, " ")} `;
      const paddedDuration = ` ${duration.padStart(DURATION_WIDTH, " ")} `;
      const paddedRemoteAddress = ` ${remoteAddress.padStart(REMOTE_ADDR_WIDTH, " ")} `;

      return (
        `${SERVICE_COLOR}[${log.service}]${RESET} ${MODULE_COLOR}[http]${RESET} | ` +
        `${statusColor(code)}${paddedStatus}${RESET} | ` +
        `${durationColor}${paddedDuration}${RESET} | ` +
        `${paddedRemoteAddress} | ` +
        `${methodColor(method)}${paddedMethod}${RESET} "${log.path}"`
      );
    },
  });
