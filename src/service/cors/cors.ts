import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "cors-service" });

import ClientModel from "../../model/mongo/client.js";
import { Configuration } from "../../singleton/configuration.js";

export class CORS {
  systemOrigins = [...Configuration.get("cors.allowed-origins"), Configuration.get("system.app-host")];
  allowedOrigins = new Set(this.systemOrigins);

  extractOrigin(uri: string): string {
    const url = new URL(uri);
    const origin = url.origin;
    return origin;
  }

  public scheduleScan() {
    this.scanOrigins();
    setInterval(
      () => {
        log.debug("Scanning for new CORS origins...");
        this.scanOrigins();
      },
      Configuration.get("cors.scan-interval") * 1000,
    );
  }

  public async scanOrigins() {
    this.allowedOrigins = new Set(this.systemOrigins);
    const clients = await ClientModel.find();
    if (!clients) {
      log.warn("No clients found. Skipping origin scan.");
      return;
    }
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      log.debug("Scanning client: %o", client);
      for (let uri of client.redirectUris) {
        try {
          const hostname = this.extractOrigin(uri);
          log.debug("Adding allowed origin: %s", hostname);
          this.allowedOrigins.add(hostname);
        } catch (e) {
          log.error("Error parsing origin from URI: %s", uri);
          continue;
        }
      }
    }
    log.info("Allowed origins: %o", Array.from(this.allowedOrigins));
  }

  public isAllowedOrigin(origin: string | undefined): boolean {
    if (this.allowedOrigins.has(origin) || !origin) {
      return true;
    }
    return false;
  }

  public initialize() {
    this.scanOrigins();
    this.scheduleScan();
  }
}

