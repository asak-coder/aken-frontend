const DEFAULT_DEV_API_URL = "http://localhost:5000";

function normalizeHttpUrl(rawValue: string | undefined): string {
  const value = (rawValue || "").trim();
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function getNodeEnv() {
  return process.env.NODE_ENV || "development";
}

export function getPublicApiBaseUrl() {
  const configuredUrl = normalizeHttpUrl(process.env.NEXT_PUBLIC_API_URL);
  if (configuredUrl) {
    return configuredUrl;
  }

  if (getNodeEnv() !== "production") {
    return DEFAULT_DEV_API_URL;
  }

  return "";
}

export function getPublicGaId() {
  const gaId = (process.env.NEXT_PUBLIC_GA_ID || "").trim();
  const validGaId = /^G-[A-Z0-9]+$/i;
  return validGaId.test(gaId) ? gaId : "";
}

export function getPublicGoogleAdsId() {
  const adsId = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "").trim();
  const validAdsId = /^AW-\d+$/i;
  return validAdsId.test(adsId) ? adsId : "";
}

export function getPublicGoogleAdsLeadLabel() {
  const label = (process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || "").trim();
  const validLabel = /^[A-Za-z0-9_-]+$/;
  return validLabel.test(label) ? label : "";
}

export function getPublicGoogleAdsLeadSendTo() {
  const adsId = getPublicGoogleAdsId();
  const label = getPublicGoogleAdsLeadLabel();

  if (!adsId || !label) {
    return "";
  }

  return `${adsId}/${label}`;
}

export function getEnvWarnings() {
  const warnings: string[] = [];

  if (!normalizeHttpUrl(process.env.NEXT_PUBLIC_API_URL)) {
    if (getNodeEnv() === "production") {
      warnings.push(
        "NEXT_PUBLIC_API_URL is missing or invalid. Lead forms will fail in production.",
      );
    }
  }

  if ((process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "").trim()) {
    warnings.push(
      "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET must be removed. Public env variables are exposed to every browser.",
    );
  }

  const rawAdsId = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "").trim();
  const rawLeadLabel = (process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || "").trim();
  const validAdsId = getPublicGoogleAdsId();
  const validLeadLabel = getPublicGoogleAdsLeadLabel();

  if (rawAdsId && !validAdsId) {
    warnings.push(
      "NEXT_PUBLIC_GOOGLE_ADS_ID is invalid. Expected format: AW-123456789.",
    );
  }

  if (rawLeadLabel && !validLeadLabel) {
    warnings.push(
      "NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL is invalid. Use only letters, numbers, '_' or '-'.",
    );
  }

  if (getNodeEnv() === "production") {
    if ((validAdsId && !validLeadLabel) || (!validAdsId && validLeadLabel)) {
      warnings.push(
        "Google Ads conversion setup is incomplete. Set both NEXT_PUBLIC_GOOGLE_ADS_ID and NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL.",
      );
    }
  }

  return warnings;
}
