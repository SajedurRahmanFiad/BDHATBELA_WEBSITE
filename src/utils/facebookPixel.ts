/**
 * Facebook Pixel Tracking Utility
 * Handles all Facebook Pixel tracking events
 */

let pixelInitialized = false;
let pixelSettings: any = null;

/**
 * Initialize Facebook Pixel with settings
 */
export const initializeFacebookPixel = (settings: any) => {
    if (!settings?.metaPixel?.enabled || !settings?.metaPixel?.pixelId) {
        console.warn('Facebook Pixel is not enabled or Pixel ID is missing');
        return;
    }

    pixelSettings = settings.metaPixel;

    // Load the Facebook Pixel script
    loadFacebookPixelScript(pixelSettings.pixelId);
    pixelInitialized = true;

    // Track initial page view
    if (window.fbq) {
        window.fbq('track', 'PageView');
    }
};

/**
 * Load Facebook Pixel script
 */
const loadFacebookPixelScript = (pixelId: string) => {
    if (document.querySelector(`script[data-pixel-id="${pixelId}"]`)) {
        return; // Already loaded
    }

    // Load fbq
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script1.setAttribute('data-pixel-id', pixelId);
    document.head.appendChild(script1);

    // Initialize fbq
    window.fbq = window.fbq || function () {
        (window.fbq as any).queue = (window.fbq as any).queue || [];
        (window.fbq as any).queue.push(arguments);
    };
    window.fbq('init', pixelId);

    // Noscript tag
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
    if (!pixelInitialized || !window.fbq) {
        console.warn('Facebook Pixel is not initialized');
        return;
    }

    try {
        // Add currency from settings if available and not provided
        if (pixelSettings?.currency && (!eventData || !eventData.currency)) {
            eventData = {
                ...eventData,
                currency: pixelSettings.currency
            };
        }

        window.fbq('track', eventName, eventData || {});
        console.log(`[Facebook Pixel] Tracked event: ${eventName}`, eventData);
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
        value: product.price,
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
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    trackPixelEvent('AddToCart', {
        content_ids: items.map(item => item.id),
        content_names: items.map(item => item.name),
        content_type: 'product',
        value: totalValue,
        num_items: items.length,
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
        value: totalPrice,
        num_items: items.length,
    });
};

/**
 * Track add payment info event
 */
export const trackAddPaymentInfo = (totalPrice: number) => {
    trackPixelEvent('AddPaymentInfo', {
        value: totalPrice,
        content_type: 'product',
    });
};

/**
 * Track purchase event (most important for conversions)
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
        value: order.totalPrice,
        currency: pixelSettings?.currency || 'BDT',
        content_ids: order.items.map(item => item.id),
        content_names: order.items.map(item => item.name),
        content_type: 'product',
        num_items: order.items.length,
        transaction_id: order.id,
        shipping: order.shippingCost,
    });
};

/**
 * Track page view (auto-tracked on route changes)
 */
export const trackPageView = () => {
    if (!pixelInitialized || !window.fbq) {
        return;
    }
    window.fbq('track', 'PageView');
};

// Declare window fbq for TypeScript
declare global {
    interface Window {
        fbq?: any;
    }
}
