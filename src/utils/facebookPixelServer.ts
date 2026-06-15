import { StoreSettings } from '../types';
import { API_BASE_URL } from '../constants';

const normalizeString = (value?: string) => {
    return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
};

const hashSHA256 = async (value: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const buildUserData = async (userData: Record<string, any>) => {
    const normalizedUserData: Record<string, string> = {};
    if (userData.email) normalizedUserData.email = await hashSHA256(normalizeString(userData.email) || '');
    if (userData.phone) normalizedUserData.phone = await hashSHA256(normalizeString(userData.phone) || '');
    if (userData.first_name) normalizedUserData.first_name = await hashSHA256(normalizeString(userData.first_name) || '');
    if (userData.last_name) normalizedUserData.last_name = await hashSHA256(normalizeString(userData.last_name) || '');
    return normalizedUserData;
};

export const sendServerSideEvent = async (
    settings: StoreSettings,
    eventName: string,
    eventId: string,
    customData: Record<string, any>,
    userData: Record<string, any> = {}
) => {
    if (!settings?.metaPixel?.enabled || !settings?.metaPixel?.pixelId || !settings?.metaPixel?.accessToken) {
        console.warn('Server-side Facebook Pixel is not configured or enabled');
        return;
    }

    const pixelId = settings.metaPixel.pixelId;
    const accessToken = settings.metaPixel.accessToken;
    const normalizedUserData = await buildUserData(userData);

    const body = {
        pixel_id: pixelId,
        access_token: accessToken,
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user_data: normalizedUserData,
        custom_data: customData,
        event_source_url: window.location.href,
        page_url: window.location.href
    };

    const endpoint = `${API_BASE_URL}/facebook_pixel.php`;
    await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
};
