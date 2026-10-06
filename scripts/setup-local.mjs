import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log("Existing .env preserved. Review .env.example for new settings.");
} else {
  const example = readFileSync(".env.example", "utf8")
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString("hex")}`)
    .replace(/^CRON_SECRET=.*$/m, `CRON_SECRET=${randomBytes(32).toString("hex")}`);
  writeFileSync(".env", example, { flag: "wx", mode: 0o600 });
  console.log("Created .env with random local secrets. Add your API and SMTP settings there.");
}
