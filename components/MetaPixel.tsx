'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/meta-pixel';

/**
 * Meta Pixel Component
 * 
 * This component loads the Meta (Facebook) Pixel tracking script
 * and tracks page views automatically.
 * 
 * Pixel ID: 1149398383442148
 * 
 * Features:
 * - Automatic page view tracking on route changes
 * - Non-blocking script loading (async)
 * - TypeScript support
 * 
 * Events tracked:
 * - PageView (automatic)
 * - CompleteRegistration (when user completes signup)
 * - Purchase (when payment is successful)
 * - AddPaymentInfo (when user initiates payment)
 * - Lead (when user shows interest)
 * - Contact (when user contacts support)
 */
export default function MetaPixel() {
  const pathname = usePathname();

  // Track page views on route changes
  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return (
    <>
      {/* Meta Pixel Script */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1149398383442148');
            fbq('track', 'PageView');
          `,
        }}
      />
      
      {/* Noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1149398383442148&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
}
