type GA4Item = {
  item_id: string;
  id?: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
  item_brand?: string;
  index?: number;
  stocklevel?: number;
  stockstatus?: string;
  affiliation?: string;
  productType?: string;
  google_business_vertical?: string;
};

type GA4ItemInput = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  sku?: string;
  stock?: number;
  productType?: string;
  itemBrand?: string;
  index?: number;
  affiliation?: string;
  googleBusinessVertical?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const ensureDataLayer = () => {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
};



const pushDataLayerEvent = (eventName: string, params: Record<string, unknown>) => {
  ensureDataLayer();
  
  // Clear the previous ecommerce object to prevent data leakage in SPA
  window.dataLayer?.push({ ecommerce: null });
  
  const eventPayload = {
    event: eventName,
    ecommerce: params,
  };
  
  window.dataLayer?.push(eventPayload);
};

export const trackGA4Event = (eventName: string, params: Record<string, unknown>) => {
  console.log('[GTM eCommerce Event]', eventName, params);
  pushDataLayerEvent(eventName, params);
};

const normalizeItem = (item: GA4ItemInput): GA4Item => {
  const itemIdentifier = item.sku || item.id;
  return {
    item_id: itemIdentifier,
    id: itemIdentifier,
    item_name: item.name,
    item_category: item.category,
    item_variant: item.sku || undefined,
    item_brand: item.itemBrand,
    index: item.index,
    stocklevel: item.stock,
    stockstatus: item.stock === undefined ? undefined : item.stock > 0 ? 'instock' : 'outofstock',
    affiliation: item.affiliation,
    google_business_vertical: item.googleBusinessVertical,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
    productType: item.productType,
  };
};

export const trackViewItem = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  sku?: string;
  stock?: number;
  productType?: string;
  itemBrand?: string;
  index?: number;
  affiliation?: string;
  googleBusinessVertical?: string;
}) => {
  const eventPayload = {
    currency: 'BDT',
    value: Number(product.price) || 0,
    items: [
      normalizeItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
        sku: product.sku,
        stock: product.stock,
        productType: product.productType,
        itemBrand: product.itemBrand,
        index: product.index,
      }),
    ],
  };

  trackGA4Event('view_item', eventPayload);
};

export const trackAddToCart = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
  stock?: number;
  productType?: string;
  itemBrand?: string;
  index?: number;
}>) => {
  const eventPayload = {
    currency: 'BDT',
    value: items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0),
    items: items.map(item => normalizeItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
      sku: item.sku,
      productType: item.productType,
      itemBrand: item.itemBrand,
      index: item.index,
    })),
  };

  trackGA4Event('add_to_cart', eventPayload);
};

export const trackBeginCheckout = (items: Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
  productType?: string;
  itemBrand?: string;
  index?: number;
}>, total: number) => {
  const eventPayload = {
    currency: 'BDT',
    value: Number(total) || 0,
    items: items.map(item => normalizeItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
      sku: item.sku,
      productType: item.productType,
      itemBrand: item.itemBrand,
      index: item.index,
    })),
  };

  trackGA4Event('begin_checkout', eventPayload);
};

export const trackPurchase = (order: {
  id: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string; sku?: string; stock?: number; productType?: string; itemBrand?: string; index?: number }>;
  total: number;
  coupon?: string | null;
  shipping?: number;
  tax?: number;
}) => {
  const eventPayload = {
    transaction_id: order.id,
    currency: 'BDT',
    value: Number(order.total) || 0,
    coupon: order.coupon || undefined,
    shipping: order.shipping !== undefined ? Number(order.shipping) : undefined,
    tax: order.tax !== undefined ? Number(order.tax) : undefined,
    items: order.items.map(item => normalizeItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
      sku: item.sku,
      productType: item.productType,
      itemBrand: item.itemBrand,
      index: item.index,
    })),
  };

  trackGA4Event('purchase', eventPayload);
};
