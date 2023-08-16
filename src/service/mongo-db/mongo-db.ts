import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "mongo-db" });

import mongoose, { ClientSession, Connection } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import { Configuration } from "../../singleton/configuration";

export class MongoDB {
  connection!: Connection;
  sessions: Map<string, ClientSession> = new Map();
  useTransactions: boolean = false;

  constructor() {
    mongoose.set("strictQuery", false);
    mongoose.set('runValidators', true);
    this.useTransactions = Configuration.get("mongo-db.use-transactions");
    if (this.useTransactions) {
      log.info("MongoDB transactions are enabled.");
    } else {
      log.info(
        "MongoDB transactions are disabled, this means failure of APIs with multiple write operations will result in inconsistent data in the database. If you have MongoDB running with replica sets, it is highly recommended that you turn on the option mongo-db.use-transactions (MongoDB Use Transactions)."
      );
    }
  }

  public async connect() {
    try {
      const connectionString = Configuration.get("mongo-db.connection-string");
      await mongoose.connect(connectionString as string);
      this.connection = mongoose.connection;
      log.info("Connected to MongoDB (%s).", connectionString.replace(/\/\/([^:]+):(.*)@/, "//***:***@"));
    } catch (error) {
      log.error(error);
    }
  }

  public async startSession() {
    if (!this.useTransactions) {
      return "";
    }
    const sessionId = uuidv4();
    const session = await this.connection.startSession();
    this.sessions.set(sessionId, session);
    log.debug("Transaction session started: %s", sessionId);
    return sessionId;
  }

  public startTransaction(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      log.debug("Starting transaction for session %s.", sessionId);
      return session.startTransaction();
    }
  }

  public commitTransaction(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      log.debug("Committing transaction for session %s.", sessionId);
      this.sessions.delete(sessionId);
      return session.commitTransaction();
    }
  }

  public abortTransaction(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      log.debug("Aborting transaction for session %s.", sessionId);
      this.sessions.delete(sessionId);
      return session.abortTransaction();
    }
  }

  public getSessionOptions(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return { session };
    }
  }
}
