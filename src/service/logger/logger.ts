import pino from "pino";
import pretty from "pino-pretty";
import { Configuration } from "../../singleton/configuration";

export class Logger {
  logger;

  constructor() {
    const stream = pretty({
      colorize: true,
      translateTime: "yyyy-dd-mm HH:MM:ss",
    });
    this.logger = pino(stream);
    this.logger.level = Configuration.get("system.log-level") as string;
  }

  public getLogger(): any {
    return this.logger;
  }
}
