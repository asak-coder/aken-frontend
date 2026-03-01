import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";
import AttributionTracker from "@/components/AttributionTracker";
import GA4PageTracker from "@/components/GA4PageTracker";
import { getEnvWarnings, getPublicGaId, getPublicGoogleAdsId } from "@/lib/env";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = getPublicGaId();
  const ADS_ID = getPublicGoogleAdsId();
  const GTAG_BOOTSTRAP_ID = GA_ID || ADS_ID;
  const envWarnings = getEnvWarnings();

  if (envWarnings.length > 0) {
    for (const warning of envWarnings) {
      console.warn(`[env-warning] ${warning}`);
    }
  }

  return (
    <html lang="en">
      <head>
        {GTAG_BOOTSTRAP_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_BOOTSTRAP_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${GA_ID ? `
                gtag('config', '${GA_ID}', {
                  send_page_view: false,
                  anonymize_ip: true
                });
                ` : ""}
                ${ADS_ID ? `
                gtag('config', '${ADS_ID}');
                ` : ""}
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <AttributionTracker />
        <Suspense fallback={null}>
          <GA4PageTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
