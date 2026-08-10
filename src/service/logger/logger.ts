import pino from "pino";
import fs from "fs";

import { Configuration } from "../../singleton/configuration.js";
import PinoPretty from "pino-pretty";

export class Logger {
  logger;

  constructor() {
    // Silent logging in test environment
    if (process.env.NODE_ENV === 'test') {
      this.logger = pino({ level: 'silent' });
      return;
    }

    const prettyStream = PinoPretty({
      colorize: true,
      translateTime: "yyyy-dd-mm HH:MM:ss",
    });

    var streams: any[] = [{ level: Configuration.get("system.log-level"), stream: prettyStream }];

    const logFilePath = Configuration.get("system.log-file-path");
    if (logFilePath) {
      const fileStream = fs.createWriteStream(logFilePath);
      streams.push({ level: Configuration.get("system.log-level"), stream: fileStream });
    }

    this.logger = pino({ level: Configuration.get("system.log-level") }, pino.multistream(streams));
  }

  public getLogger(): any {
    return this.logger;
  }
}
