import nodemailer from "nodemailer";
import { z } from "zod";

const smtpSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().email(),
});

export function passwordResetOrigin(developmentOrigin: string): string {
  if (process.env.NODE_ENV !== "production") return developmentOrigin;
  const url = new URL(process.env.APP_URL || "");
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("APP_URL must be a public HTTPS origin");
  return url.origin;
}

export function isPasswordResetMailConfigured(): boolean {
  try {
    smtpSchema.parse(process.env);
    passwordResetOrigin("http://localhost:3000");
    return true;
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const config = smtpSchema.parse(process.env);
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    requireTLS: config.SMTP_PORT !== 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  await transport.sendMail({
    from: config.SMTP_FROM,
    to: email,
    subject: "CV Optimizer — Şifre sıfırlama",
    text: `Şifrenizi sıfırlamak için aşağıdaki bağlantıyı açın. Bağlantı 1 saat geçerlidir.\n\n${resetLink}\n\nBu isteği siz yapmadıysanız bu e-postayı dikkate almayın.`,
  });
}
