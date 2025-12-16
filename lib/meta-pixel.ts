// lib/meta-pixel.ts
/**
 * Meta Pixel (Facebook Pixel) Integration
 * 
 * Pixel ID: 1149398383442148
 * 
 * This script tracks user behavior and conversions on the website.
 * It helps measure the effectiveness of advertising campaigns.
 */

// Type definitions for Facebook Pixel
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, any>) => void;
    _fbq: any;
  }
}

/**
 * Initialize Meta Pixel
 * Should be called once in the root layout
 */
export const initMetaPixel = () => {
  if (typeof window === 'undefined') return;
  
  // Check if already initialized
  if (typeof window.fbq !== 'undefined') return;

  // Facebook Pixel initialization code
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  (window.fbq as any)('init', '1149398383442148');
  (window.fbq as any)('track', 'PageView');
};

/**
 * Track page view
 * Call this on route changes
 */
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

/**
 * Track registration started
 */
export const trackRegistrationStarted = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout');
  }
};

/**
 * Track registration completed
 * @param offer - Selected offer (basic, premium, gold)
 * @param amount - Payment amount
 */
export const trackRegistrationCompleted = (offer: string, amount: number) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: offer,
      value: amount,
      currency: 'DZD'
    });
  }
};

/**
 * Track payment initiated
 * @param method - Payment method (cib, baridimob)
 * @param amount - Payment amount
 */
export const trackPaymentInitiated = (method: string, amount: number) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', {
      content_name: method,
      value: amount,
      currency: 'DZD'
    });
  }
};

/**
 * Track successful payment (conversion)
 * @param offer - Selected offer
 * @param amount - Payment amount
 * @param paymentType - initial or second
 */
export const trackPurchase = (offer: string, amount: number, paymentType: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_name: `${offer} - ${paymentType}`,
      value: amount,
      currency: 'DZD'
    });
  }
};

/**
 * Track lead (when user shows interest)
 */
export const trackLead = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead');
  }
};

/**
 * Track contact (when user opens contact form or clicks contact)
 */
export const trackContact = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Contact');
  }
};
