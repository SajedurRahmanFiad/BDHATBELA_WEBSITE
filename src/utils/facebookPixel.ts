/**
 * Facebook Pixel Tracking Utility
 * Handles browser Pixel events. Server-side Purchase events are sent from backend/api/orders.php.
 */

type MetaPixelSettings = {
  pixelId: string;
  currency?: string;
  domain?: string;
  businessAccountId?: string;
  timezone?: string;
};

type FbqQueueItem = IArguments | unknown[];

type Fbq = {
  (...args: unknown[]): void;
  queue?: FbqQueueItem[];
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

let pixelInitialized = false;
let activePixelId: string | null = null;
let pixelSettings: MetaPixelSettings | null = null;

const normalizePixelId = (pixelId?: string) => {
  const raw = String(pixelId ?? '').trim();
  return raw.replace(/^['"]+|['"]+$/g, '').trim();
};

const escapeSelectorValue = (value: string) => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
};

const hasFacebookPixelScript = (pixelId: string) => {
  try {
    return !!document.querySelector(`script[data-facebook-pixel="${escapeSelectorValue(pixelId)}"]`);
  } catch {
    return Array.from(document.querySelectorAll('script[data-facebook-pixel]')).some(
      (el) => el.getAttribute('data-facebook-pixel') === pixelId
    );
  }
};

const hasGtmContainer = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const gtmScriptExists = !!document.querySelector(
    'script[src*="googletagmanager.com/gtm.js"], script[src*="googletagmanager.com/gtag/js"], script[data-gtm-container-id]'
  );

  const hasGtmDataLayer = Array.isArray((window as any).dataLayer)
    ? (window as any).dataLayer.some((item: any) => item && typeof item === 'object' && ('gtm.start' in item || item.event === 'gtm.js'))
    : false;

  return gtmScriptExists || hasGtmDataLayer || !!(window as any).google_tag_manager;
};

const pushPixelEventToDataLayer = (eventName: string, eventData?: Record<string, unknown>) => {
  const dataLayer = (window as any).dataLayer || ((window as any).dataLayer = []);
  dataLayer.push({
    event: 'facebook_pixel_event',
    facebook_pixel_event_name: eventName,
    facebook_pixel_data: eventData || {},
  });
};

const ensureFbq = () => {
  if (window.fbq) return window.fbq;

  const fbq = ((...args: unknown[]) => {
    const [method, eventName] = args;

    if (hasGtmContainer() && method === 'track' && typeof eventName === 'string') {
      pushPixelEventToDataLayer(eventName, (args[2] as Record<string, unknown>) || undefined);
      return;
    }

    (fbq as Fbq).queue?.push(args);
  }) as Fbq;

  fbq.queue = [];
  fbq.callMethod = (...args: unknown[]) => {
    (fbq as Fbq).queue?.push(args);
  };

  window.fbq = fbq;
  return fbq;
};

/**
 * Initialize Facebook Pixel with settings
 */
export const initializeFacebookPixel = (settings: any) => {
  const metaPixel = settings?.metaPixel;
  const normalizedPixelId = normalizePixelId(metaPixel?.pixelId);

  if (!metaPixel?.enabled || !normalizedPixelId) {
    pixelSettings = null;
    pixelInitialized = false;
    activePixelId = null;
    console.warn('Facebook Pixel is not enabled or Pixel ID is missing');
    return;
  }

  const nextSettings: MetaPixelSettings = {
    ...metaPixel,
    pixelId: normalizedPixelId,
    currency: String(metaPixel.currency || 'BDT').toUpperCase(),
  };

  pixelSettings = nextSettings;
  pixelInitialized = true;

  if (activePixelId !== normalizedPixelId) {
    loadFacebookPixelScript(normalizedPixelId);
    ensureFbq()('init', normalizedPixelId);
    activePixelId = normalizedPixelId;
  }

  ensureFbq()('track', 'PageView');
};

/**
 * Load Facebook Pixel script
 */
const loadFacebookPixelScript = (pixelId: string) => {
  if (hasFacebookPixelScript(pixelId)) {
    return;
  }

  ensureFbq();

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.setAttribute('data-facebook-pixel', pixelId);
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.head.appendChild(noscript);
};

/**
 * Track Facebook Pixel event
 */
export const trackPixelEvent = (eventName: string, eventData?: Record<string, any>) => {
  const fbq = window.fbq;
  if (!fbq) {
    console.warn('Facebook Pixel is not initialized');
    return;
  }

  try {
    const nextEventData: Record<string, any> = {
      ...(eventData || {}),
      currency: String(pixelSettings?.currency || eventData?.currency || 'BDT').toUpperCase(),
    };
    const eventId = nextEventData.event_id || nextEventData.transaction_id;

    fbq('track', eventName, nextEventData, eventId ? { eventID: eventId } : undefined);
    console.log(`[Facebook Pixel] Tracked event: ${eventName}`, nextEventData);
  } catch (error) {
    console.error('[Facebook Pixel] Error tracking event:', error);
  }
};

/**
 * Track view content (product page view)
 */
export const trackViewContent = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  sku?: string;
}) => {
  trackPixelEvent('ViewContent', {
    content_name: product.name,
    content_type: 'product',
    content_ids: [product.id],
    value: Number(product.price) || 0,
    sku: product.sku || product.id,
    category: product.category,
  });
};

/**
 * Track add to cart event
 */
export const trackAddToCart = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}>) => {
  const totalValue = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  trackPixelEvent('AddToCart', {
    content_ids: items.map(item => item.id),
    content_names: items.map(item => item.name),
    content_type: 'product',
    value: totalValue,
    num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
  });
};

/**
 * Track initiate checkout event
 */
export const trackInitiateCheckout = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
}>, totalPrice: number) => {
  trackPixelEvent('InitiateCheckout', {
    content_ids: items.map(item => item.id),
    content_names: items.map(item => item.name),
    content_type: 'product',
    value: Number(totalPrice) || 0,
    num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
  });
};

/**
 * Track add payment info event
 */
export const trackAddPaymentInfo = (params: {
  totalPrice: number;
  paymentMethod?: string;
  numItems?: number;
  contentIds?: string[];
  contentNames?: string[];
}) => {
  trackPixelEvent('AddPaymentInfo', {
    value: Number(params.totalPrice) || 0,
    content_type: 'product',
    payment_method: params.paymentMethod,
    num_items: params.numItems,
    content_ids: params.contentIds,
    content_names: params.contentNames,
  });
};

export const trackSearch = (searchQuery: string, totalResults?: number) => {
  trackPixelEvent('Search', {
    search_string: searchQuery,
    content_type: 'product',
    value: 0,
    currency: pixelSettings?.currency,
    num_items: totalResults,
  });
};

export const trackContact = () => {
  trackPixelEvent('Contact', {
    content_name: 'Contact Form',
    content_category: 'Support',
    status: 'submitted',
    value: 0,
  });
};

export const trackCompleteRegistration = () => {
  trackPixelEvent('CompleteRegistration', {
    content_name: 'Account Signup',
    status: 'success',
    value: 0,
  });
};

/**
 * Track purchase event from browser Pixel
 */
export const trackPurchase = (order: {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
  }>;
  totalPrice: number;
  shippingCost?: number;
}) => {
  trackPixelEvent('Purchase', {
    value: Number(order.totalPrice) || 0,
    content_ids: order.items.map(item => item.id),
    content_names: order.items.map(item => item.name),
    content_type: 'product',
    num_items: order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    event_id: order.id,
    transaction_id: order.id,
    shipping: Number(order.shippingCost || 0),
  });
};

/**
 * Track page view (auto-tracked on route changes)
 */
export const trackPageView = () => {
  const fbq = window.fbq;
  if (!fbq) return;
  fbq('track', 'PageView');
};
