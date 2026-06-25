type GA4Item = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
  item_brand?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ensureDataLayer = () => {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
};

let ga4Initialized = false;

const ensureGtag = () => {
  if (!window.gtag) {
    ensureDataLayer();
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
};

const loadGtagScript = (measurementId: string) => {
  const normalizedId = measurementId.trim();
  if (!normalizedId) return;
  if (document.querySelector(`script[data-ga4-measurement-id="${normalizedId}"]`)) return;

  ensureGtag();

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${normalizedId}`;
  script.setAttribute('data-ga4-measurement-id', normalizedId);
  document.head.appendChild(script);
};

const gtag = (...args: unknown[]) => {
  if (!ga4Initialized) return;
  ensureGtag();
  window.gtag?.(...args);
};

export const initializeGA4 = (measurementId: string) => {
  const normalizedId = String(measurementId || '').trim();
  if (!normalizedId) return;

  loadGtagScript(normalizedId);
  ga4Initialized = true;
  gtag('js', new Date());
  gtag('config', normalizedId, { currency: 'BDT' });
};

export const trackGA4Event = (eventName: string, params: Record<string, unknown>) => {
  if (!ga4Initialized) return;
  gtag('event', eventName, params);
};

export const trackViewItem = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  sku?: string;
}) => {
  trackGA4Event('view_item', {
    currency: 'BDT',
    value: Number(product.price) || 0,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_variant: product.sku || undefined,
        price: Number(product.price) || 0,
        quantity: 1,
      },
    ],
  });
};

export const trackAddToCart = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
}>) => {
  trackGA4Event('add_to_cart', {
    currency: 'BDT',
    value: items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0),
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_variant: item.sku || undefined,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0,
    })) as GA4Item[],
  });
};

export const trackBeginCheckout = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
}>, total: number) => {
  trackGA4Event('begin_checkout', {
    currency: 'BDT',
    value: Number(total) || 0,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_variant: item.sku || undefined,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0,
    })) as GA4Item[],
  });
};

export const trackPurchase = (order: {
  id: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string; sku?: string }>;
  total: number;
}) => {
  trackGA4Event('purchase', {
    transaction_id: order.id,
    currency: 'BDT',
    value: Number(order.total) || 0,
    items: order.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_variant: item.sku || undefined,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0,
    })) as GA4Item[],
  });
};
