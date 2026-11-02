import morgan, { StreamOptions } from "morgan";
import { IncomingMessage, ServerResponse } from "http";
import { appConfig } from "../../config/app-config";

morgan.token("id", (req) => {
  return (req.headers["x-request-id"] as string) || "unknown";
});

const stream: StreamOptions = {
  write: (message: string) => process.stdout.write(message),
};

const format = appConfig.isProduction
  ? ':id :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms'
  : ":id :method :url :status :response-time ms";

export const httpLogger = morgan(format, {
  stream,
  skip: (_req: IncomingMessage, res: ServerResponse) =>
    appConfig.isProduction && res.statusCode < 400,
});
