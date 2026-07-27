import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type StoredPrintfulIntegration = {
  id: number;
  companyId: number;
  encryptedAccessToken: string;
  storeId: string | null;
  storeName: string | null;
  storeType: string | null;
  status: string;
  lastTestedAt: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function getEncryptionKey() {
  const secret = process.env.PRINTFUL_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing PRINTFUL_TOKEN_ENCRYPTION_KEY environment variable");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptPrintfulToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptPrintfulToken(payload: string) {
  const [ivValue, authTagValue, encryptedValue] = payload.split(".");
  if (!ivValue || !authTagValue || !encryptedValue) throw new Error("Invalid encrypted Printful token");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getPrintfulIntegration(companyId: number) {
  const rows = await prisma.$queryRaw<StoredPrintfulIntegration[]>`
    SELECT * FROM "PrintfulIntegration" WHERE "companyId" = ${companyId} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getPrintfulCredentials(companyId: number) {
  const integration = await getPrintfulIntegration(companyId);
  if (!integration) return null;
  return {
    accessToken: decryptPrintfulToken(integration.encryptedAccessToken),
    storeId: integration.storeId,
    integration,
  };
}

export async function savePrintfulIntegration(input: {
  companyId: number;
  accessToken: string;
  storeId?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  status?: string;
}) {
  const encryptedAccessToken = encryptPrintfulToken(input.accessToken.trim());
  const rows = await prisma.$queryRaw<StoredPrintfulIntegration[]>`
    INSERT INTO "PrintfulIntegration" (
      "companyId", "encryptedAccessToken", "storeId", "storeName", "storeType", "status", "lastTestedAt", "updatedAt"
    ) VALUES (
      ${input.companyId}, ${encryptedAccessToken}, ${input.storeId || null}, ${input.storeName || null}, ${input.storeType || null}, ${input.status || "connected"}, NOW(), NOW()
    )
    ON CONFLICT ("companyId") DO UPDATE SET
      "encryptedAccessToken" = EXCLUDED."encryptedAccessToken",
      "storeId" = EXCLUDED."storeId",
      "storeName" = EXCLUDED."storeName",
      "storeType" = EXCLUDED."storeType",
      "status" = EXCLUDED."status",
      "lastTestedAt" = NOW(),
      "updatedAt" = NOW()
    RETURNING *
  `;
  return rows[0];
}

export async function updatePrintfulConnectionMetadata(input: {
  companyId: number;
  storeId?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  status: string;
}) {
  await prisma.$executeRaw`
    UPDATE "PrintfulIntegration"
    SET "storeId" = COALESCE(${input.storeId || null}, "storeId"),
        "storeName" = ${input.storeName || null},
        "storeType" = ${input.storeType || null},
        "status" = ${input.status},
        "lastTestedAt" = NOW(),
        "updatedAt" = NOW()
    WHERE "companyId" = ${input.companyId}
  `;
}

export async function markPrintfulSynced(companyId: number) {
  await prisma.$executeRaw`
    UPDATE "PrintfulIntegration"
    SET "lastSyncedAt" = NOW(), "status" = 'connected', "updatedAt" = NOW()
    WHERE "companyId" = ${companyId}
  `;
}

export async function deletePrintfulIntegration(companyId: number) {
  await prisma.$executeRaw`DELETE FROM "PrintfulIntegration" WHERE "companyId" = ${companyId}`;
}

export function publicPrintfulIntegration(integration: StoredPrintfulIntegration | null) {
  if (!integration) return { connected: false, status: "disconnected" };
  return {
    connected: true,
    status: integration.status,
    storeId: integration.storeId,
    storeName: integration.storeName,
    storeType: integration.storeType,
    lastTestedAt: integration.lastTestedAt,
    lastSyncedAt: integration.lastSyncedAt,
    updatedAt: integration.updatedAt,
  };
}
