import crypto from "crypto";

const fallbackUserAgent = "Unknown device";

const getHeader = (req: Request, key: string): string => {
  return req.headers.get(key)?.trim() ?? "";
};

export const getClientIp = (req: Request): string => {
  const forwarded = getHeader(req, "x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = getHeader(req, "x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "0.0.0.0";
};

export const maskIp = (ip: string): string => {
  if (ip.includes(":")) {
    const chunks = ip.split(":");
    return chunks.slice(0, 3).join(":") + ":****";
  }

  const chunks = ip.split(".");
  if (chunks.length !== 4) {
    return "***.***.***.***";
  }

  return `${chunks[0]}.${chunks[1]}.***.***`;
};

export const hashIp = (ip: string): string => {
  return crypto.createHash("sha256").update(ip).digest("hex");
};

const parseBrowser = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  return "Unknown browser";
};

const parsePlatform = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("linux")) return "Linux";
  return "Unknown OS";
};

export const getDeviceLabel = (req: Request): string => {
  const userAgent = getHeader(req, "user-agent");
  if (!userAgent) {
    return fallbackUserAgent;
  }

  const browser = parseBrowser(userAgent);
  const platform = parsePlatform(userAgent);
  return `${browser} on ${platform}`;
};

