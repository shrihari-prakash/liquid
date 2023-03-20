import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "s3" });

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { Configuration } from "../../singleton/configuration";

class S3 {
  client: S3Client;
  bucket = Configuration.get("s3.bucket-name");
  constructor() {
    log.info("Initializing S3 engine...");
    this.client = new S3Client({
      region: "auto",
      endpoint: Configuration.get("s3.endpoint"),
      credentials: {
        accessKeyId: Configuration.get("s3.access-key-id"),
        secretAccessKey: Configuration.get("s3.access-key-secret"),
      },
    });
  }
  async getSignedUrl(command: "GET" | "PUT", fileName: string, options: any = {}, expiry?: number) {
    switch (command) {
      case "GET":
        return await getSignedUrl(
          this.client,
          new GetObjectCommand({ Bucket: this.bucket, Key: fileName, ...options }),
          {
            expiresIn: expiry || Configuration.get("s3.get-object-expiry"),
          }
        );
      case "PUT":
        return await getSignedUrl(
          this.client,
          new PutObjectCommand({ Bucket: this.bucket, Key: fileName, ...options }),
          {
            expiresIn: expiry || Configuration.get("s3.put-object-expiry"),
          }
        );
    }
  }

  async delete(fileName: string) {
    var params = { Bucket: this.bucket, Key: fileName };
    const command = new DeleteObjectCommand(params);
    return await this.client.send(command);
  }
}

export default S3;
