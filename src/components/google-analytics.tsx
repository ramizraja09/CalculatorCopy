
"use client"

import Script from "next/script";

export function GoogleAnalytics() {
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  // Render nothing if the tracking ID is not set, or if it's the placeholder
  if (!gaTrackingId || gaTrackingId === "G-XXXXXXXXXX") {
    return null;
  }
  
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaTrackingId}');
        `}
      </Script>
    </>
  );
}
