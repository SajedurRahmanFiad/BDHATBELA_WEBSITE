import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { ShoppingBag } from 'lucide-react';
import { ImageUpload } from '../AdminDashboard';

export const BrandingSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();

    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        companyName: settings?.companyName || '',
        tagline: settings?.tagline || '',
        logo: settings?.logo || '',
        favicon: settings?.favicon || '',
        primaryColor: settings?.primaryColor || '#ef4444'
    });

    const handleSave = () => {
        updateSettings({ ...settings, ...localSettings } as any);
        showToast('Branding Settings saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Branding</h1>
                    <p className="text-xs text-gray-400 font-bold">Configure store branding preferences</p>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Branding Preferences</h2>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Company Shop Name</label>
                <input
                    type="text"
                    value={localSettings.companyName}
                    onChange={e => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                    placeholder="My Shop"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Tagline</label>
                <input
                    type="text"
                    value={localSettings.tagline || ''}
                    onChange={e => setLocalSettings({ ...localSettings, tagline: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                    placeholder="Just click & get!"
                />
            </div>
            <ImageUpload
                label="Main Logo Image *"
                value={localSettings.logo}
                onChange={val => setLocalSettings({ ...localSettings, logo: val })}
            />
            <ImageUpload
                label="Favicon Visual (Optional)"
                value={localSettings.favicon || ''}
                onChange={val => setLocalSettings({ ...localSettings, favicon: val })}
            />
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Theme Hex Color (Primary Accent)</label>
                <div className="flex items-center gap-4">
                    <input
                        type="color"
                        value={localSettings.primaryColor}
                        onChange={e => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                        className="w-12 h-12 rounded-lg border cursor-pointer p-1"
                    />
                    <input
                        type="text"
                        value={localSettings.primaryColor}
                        onChange={e => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                        className="flex-1 bg-gray-50 border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl outline-none transition-all font-mono text-sm font-bold"
                        placeholder="#ef4444"
                    />
                </div>
            </div>
            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Branding Options</button>
        </div>
    );
};
