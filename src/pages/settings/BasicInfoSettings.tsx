import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { Phone } from 'lucide-react';

export const BasicInfoSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();

    const normalizeSocialLink = (link: any) => ({
        enabled: typeof link === 'string' ? !!link : link?.enabled ?? false,
        url: typeof link === 'string' ? link : link?.url ?? ''
    });

    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        contactPhone: settings?.contactPhone || '',
        hotlineHours: settings?.hotlineHours || '',
        whatsappNumber: settings?.whatsappNumber || '',
        email: settings?.email || '',
        address: settings?.address || '',
        socialLinks: {
            facebook: normalizeSocialLink(settings?.socialLinks?.facebook),
            instagram: normalizeSocialLink(settings?.socialLinks?.instagram),
            youtube: normalizeSocialLink(settings?.socialLinks?.youtube),
            whatsapp: normalizeSocialLink(settings?.socialLinks?.whatsapp),
            twitter: normalizeSocialLink(settings?.socialLinks?.twitter),
            linkedin: normalizeSocialLink(settings?.socialLinks?.linkedin)
        }
    });

    const handleSave = () => {
        updateSettings({ ...settings, ...localSettings } as any);
        showToast('General Settings saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Basic Info</h1>
                    <p className="text-xs text-gray-400 font-bold">Configure contact details and social links</p>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Phone size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Hotline Number</label>
                    <input
                        value={localSettings.contactPhone}
                        onChange={e => setLocalSettings({ ...localSettings, contactPhone: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                        placeholder="01XXXXXXXXX"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Hotline Hours</label>
                    <input
                        value={localSettings.hotlineHours || ''}
                        onChange={e => setLocalSettings({ ...localSettings, hotlineHours: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                        placeholder="10:00 AM to 8:00 PM"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">WhatsApp Number</label>
                    <input
                        value={localSettings.whatsappNumber || ''}
                        onChange={e => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                        placeholder="01XXXXXXXXX"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Support Email</label>
                    <input
                        value={localSettings.email}
                        type="email"
                        onChange={e => setLocalSettings({ ...localSettings, email: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                        placeholder="support@example.com"
                    />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Physical Address / Headquarters</label>
                    <textarea
                        value={localSettings.address}
                        onChange={e => setLocalSettings({ ...localSettings, address: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg h-24 resize-none"
                        placeholder="House 123, Road 4, Uttara, Dhaka-1230"
                    />
                </div>
            </div>
            <div className="border-t pt-6 space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Social Links</h3>
                        <p className="text-xs text-gray-500">Enable the social links you want to show in the footer.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
                        { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
                        { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/yourchannel' },
                        { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/1234567890' },
                        { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/yourhandle' },
                        { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' }
                    ].map((item: any) => (
                        <div key={item.key} className="grid grid-cols-1 gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-sm font-bold text-gray-800">{item.label}</label>
                                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={(localSettings.socialLinks as any)[item.key].enabled}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            socialLinks: {
                                                ...localSettings.socialLinks,
                                                [item.key]: {
                                                    ...(localSettings.socialLinks as any)[item.key],
                                                    enabled: e.target.checked
                                                }
                                            }
                                        })}
                                        className="h-4 w-4 accent-primary"
                                    />
                                    Enabled
                                </label>
                            </div>
                            <input
                                value={(localSettings.socialLinks as any)[item.key].url}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    socialLinks: {
                                        ...localSettings.socialLinks,
                                        [item.key]: {
                                            ...(localSettings.socialLinks as any)[item.key],
                                            url: e.target.value
                                        }
                                    }
                                })}
                                type="url"
                                placeholder={item.placeholder}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save General Settings</button>
        </div>
    );
};
