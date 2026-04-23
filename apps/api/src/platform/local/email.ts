import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmailMessage, EmailPort } from "../ports";

export interface LocalEmailConfig {
  outboxDir: string;
  env: "dev" | "test" | "prod";
}

// Local email adapter: logs to stdout and, outside of test runs, drops a
// JSON file into .data/outbox/ so integration tests and manual QA can read
// it back without a real SMTP provider.
export function createLocalEmail(cfg: LocalEmailConfig): EmailPort {
  return {
    async send(message: EmailMessage): Promise<void> {
      const record = {
        ts: new Date().toISOString(),
        ...message,
      };
      console.log(JSON.stringify({ level: "info", kind: "email", ...record }));
      if (cfg.env === "prod") return;
      await mkdir(cfg.outboxDir, { recursive: true });
      const safeTo = message.to.replace(/[^a-z0-9@._-]/gi, "_");
      const filename = `${Date.now()}-${safeTo}-${message.template}.json`;
      await writeFile(join(cfg.outboxDir, filename), JSON.stringify(record, null, 2));
    },
  };
}
