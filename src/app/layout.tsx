import "./globals.css";
import Script from "next/script";
import AttributionTracker from "@/components/AttributionTracker";
import { getEnvWarnings, getPublicGaId } from "@/lib/env";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = getPublicGaId();
  const envWarnings = getEnvWarnings();

  if (envWarnings.length > 0) {
    for (const warning of envWarnings) {
      console.warn(`[env-warning] ${warning}`);
    }
  }

  return (
    <html lang="en">
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: true });
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <AttributionTracker />
        {children}
      </body>
    </html>
  );
}
