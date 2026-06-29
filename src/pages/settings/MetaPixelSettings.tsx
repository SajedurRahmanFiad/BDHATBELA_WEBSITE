import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { Zap, Copy, Check } from 'lucide-react';

export const MetaPixelSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();
    const [copied, setCopied] = React.useState<string | null>(null);

    const [localSettings, setLocalSettings] = React.useState({
        enabled: settings?.metaPixel?.enabled ?? false,
        pixelId: settings?.metaPixel?.pixelId ?? '',
        businessAccountId: settings?.metaPixel?.businessAccountId ?? '',
        accessToken: settings?.metaPixel?.accessToken ?? '',
        domain: settings?.metaPixel?.domain ?? '',
        domainVerificationTag: settings?.metaPixel?.domainVerificationTag ?? '',
        currency: settings?.metaPixel?.currency ?? 'BDT',
        timezone: settings?.metaPixel?.timezone ?? 'Asia/Dhaka',
        gtmContainerId: settings?.gtm?.containerId ?? '',
        ga4Enabled: settings?.ga4?.enabled ?? false,
        ga4MeasurementId: settings?.ga4?.measurementId ?? '',
    });

    React.useEffect(() => {
        if (!settings?.metaPixel && !settings?.gtm && !settings?.ga4) return;
        setLocalSettings({
            enabled: settings?.metaPixel?.enabled ?? false,
            pixelId: settings?.metaPixel?.pixelId ?? '',
            businessAccountId: settings?.metaPixel?.businessAccountId ?? '',
            accessToken: settings?.metaPixel?.accessToken ?? '',
            domain: settings?.metaPixel?.domain ?? '',
            domainVerificationTag: settings?.metaPixel?.domainVerificationTag ?? '',
            currency: settings?.metaPixel?.currency ?? 'BDT',
            timezone: settings?.metaPixel?.timezone ?? 'Asia/Dhaka',
            gtmContainerId: settings?.gtm?.containerId ?? '',
            ga4Enabled: settings?.ga4?.enabled ?? false,
            ga4MeasurementId: settings?.ga4?.measurementId ?? '',
        });
    }, [
        settings?.metaPixel?.enabled,
        settings?.metaPixel?.pixelId,
        settings?.metaPixel?.businessAccountId,
        settings?.metaPixel?.accessToken,
        settings?.metaPixel?.domain,
        settings?.metaPixel?.domainVerificationTag,
        settings?.metaPixel?.currency,
        settings?.metaPixel?.timezone,
        settings?.gtm?.containerId,
    ]);

    const handleChange = (field: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        const sanitizedMetaPixel = {
            enabled: localSettings.enabled,
            pixelId: localSettings.pixelId.trim().replace(/^['"]+|['"]+$/g, ''),
            businessAccountId: localSettings.businessAccountId.trim(),
            accessToken: localSettings.accessToken.trim(),
            domain: localSettings.domain.trim(),
            domainVerificationTag: localSettings.domainVerificationTag.trim(),
            currency: localSettings.currency.trim().toUpperCase(),
            timezone: localSettings.timezone,
        };

        if (sanitizedMetaPixel.enabled && !sanitizedMetaPixel.pixelId) {
            showToast('Pixel ID is required when Meta Pixel is enabled.', 'error');
            return;
        }

        const sanitizedGtmContainerId = localSettings.gtmContainerId.trim().replace(/^['"]+|['"]+$/g, '');
        const sanitizedGa4MeasurementId = localSettings.ga4MeasurementId.trim().replace(/^['"]+|['"]+$/g, '');

        const updatedSettings = {
            ...settings,
            metaPixel: sanitizedMetaPixel,
            gtm: { containerId: sanitizedGtmContainerId },
            ga4: {
                enabled: Boolean(localSettings.ga4Enabled),
                measurementId: sanitizedGa4MeasurementId,
            },
        } as any;

        updateSettings(updatedSettings);

        if (sanitizedGtmContainerId) {
            localStorage.setItem('bdhatbela_gtm_container_id', sanitizedGtmContainerId);
        } else {
            localStorage.removeItem('bdhatbela_gtm_container_id');
        }

        showToast('Meta Pixel Settings saved successfully!');
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const demoCode = `// Usage in your components
import { trackPixelEvent } from '../../utils/facebookPixel';

// Track view content (product page)
trackPixelEvent('ViewContent', {
  content_name: 'Product Name',
  content_type: 'product',
  value: 1500,
  currency: 'BDT'
});

// Track add to cart
trackPixelEvent('AddToCart', {
  content_name: 'Product Name',
  value: 1500,
  currency: 'BDT'
});

// Track purchase
trackPixelEvent('Purchase', {
  value: 3500,
  currency: 'BDT'
});`;

    return (
        <div className="bg-white p-6 sm:p-8 rounded-4xl shadow-sm border border-gray-100 space-y-6 max-w-4xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900 flex items-center gap-2">
                        <Zap size={28} className="text-blue-500" />
                        Meta Pixel & GTM Setup
                    </h1>
                    <p className="text-xs text-gray-400 font-bold">Configure Facebook Pixel and Google Tag Manager for this client</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="space-y-4">
                    {/* Google Tag Manager Container ID */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Google Tag Manager Container ID
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Enter a GTM container ID for this client like <code>GTM-XXXXXXX</code></p>
                        <input
                            type="text"
                            placeholder="GTM-XXXXXXX"
                            value={localSettings.gtmContainerId}
                            onChange={(e) => handleChange('gtmContainerId', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <label className="font-semibold text-gray-900">Enable Meta Pixel</label>
                            <p className="text-xs text-gray-500">Turn on Facebook Pixel tracking for this store</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.enabled}
                            onChange={(e) => handleChange('enabled', e.target.checked)}
                            className="w-5 h-5 rounded cursor-pointer"
                        />
                    </div>

                    {localSettings.enabled && (
                        <div className="space-y-4">
                            {/* Pixel ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Pixel ID <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Find in Meta Events Manager → Your Pixel</p>
                                <input
                                    type="text"
                                    placeholder="123456789012345"
                                    value={localSettings.pixelId}
                                    onChange={(e) => handleChange('pixelId', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Business Account ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Business Account ID (Optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">For Conversions API - Found in Business Settings</p>
                                <input
                                    type="text"
                                    placeholder="987654321098765"
                                    value={localSettings.businessAccountId}
                                    onChange={(e) => handleChange('businessAccountId', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Access Token */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Access Token (Optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">For server-side tracking - Keep this secret!</p>
                                <input
                                    type="password"
                                    placeholder="EAABzZCbB..."
                                    value={localSettings.accessToken}
                                    onChange={(e) => handleChange('accessToken', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Domain */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Domain (Optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Your website domain (e.g., bdhatbela.com)</p>
                                <input
                                    type="text"
                                    placeholder="bdhatbela.com"
                                    value={localSettings.domain}
                                    onChange={(e) => handleChange('domain', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Domain Verification Tag */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Domain Verification Meta Tag (Optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Paste the meta tag from Meta Business Settings if Meta says the domain is not configured.</p>
                                <input
                                    type="text"
                                    placeholder='<meta name="facebook-domain-verification" content="abc123..." />'
                                    value={localSettings.domainVerificationTag}
                                    onChange={(e) => handleChange('domainVerificationTag', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Currency Code
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Currency for transactions (Default: BDT)</p>
                                <input
                                    type="text"
                                    placeholder="BDT"
                                    value={localSettings.currency}
                                    onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                                    maxLength={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Timezone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Timezone
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Your business timezone</p>
                                <select
                                    value={localSettings.timezone}
                                    onChange={(e) => handleChange('timezone', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Asia/Dhaka">Asia/Dhaka (Bangladesh)</option>
                                    <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="Asia/Singapore">Asia/Singapore</option>
                                    <option value="America/New_York">America/New_York</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Enable GA4 Tracking
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Turn on Google Analytics 4 ecommerce events.</p>
                                <input
                                    type="checkbox"
                                    checked={localSettings.ga4Enabled}
                                    onChange={(e) => handleChange('ga4Enabled', e.target.checked)}
                                    className="w-5 h-5 rounded cursor-pointer"
                                />
                            </div>
                            {localSettings.ga4Enabled && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        GA4 Measurement ID
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">Enter your GA4 Measurement ID like G-XXXXXXXXXX</p>
                                    <input
                                        type="text"
                                        placeholder="G-XXXXXXXXXX"
                                        value={localSettings.ga4MeasurementId}
                                        onChange={(e) => handleChange('ga4MeasurementId', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        Save Meta Pixel Settings
                    </button>
                </div>
            </div>

            {/* Info Sections */}
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-2">📊 What Gets Tracked?</h3>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        <li>Product Views (ProductDetail page)</li>
                        <li>Add to Cart actions</li>
                        <li>Checkout Initiation</li>
                        <li>Completed Purchases</li>
                        <li>Page Views</li>
                    <li>Domain verification meta tag, if provided from Meta Business Settings</li>
                    </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-900 mb-2">💻 Usage in Components</h3>
                    <pre className="text-xs bg-white p-3 rounded overflow-auto text-purple-900">{demoCode}</pre>
                </div>
            </div>
        </div>
    );
};
