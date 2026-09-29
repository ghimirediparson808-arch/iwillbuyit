import crypto from "crypto";
import { NextRequest } from "next/server";

export function getClientIpHash(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  let rawIp = "127.0.0.1";
  if (forwardedFor) {
    rawIp = forwardedFor.split(",")[0].trim();
  } else if (realIp) {
    rawIp = realIp.trim();
  }

  const hmacSecret =
    process.env.RATE_LIMIT_HMAC_SECRET || "iwbi-fallback-rate-limit-secret";

  return crypto
    .createHmac("sha256", hmacSecret)
    .update(rawIp)
    .digest("hex");
}
