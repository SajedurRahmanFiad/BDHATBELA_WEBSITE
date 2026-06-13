import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { CheckCircle2 } from 'lucide-react';

export const ThankYouSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();

    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        thankYouPage: {
            title: settings?.thankYouPage?.title || 'Order Placed Successfully!',
            subtitle: settings?.thankYouPage?.subtitle || 'Thank you for shopping with us! Our customer representative will contact you shortly to confirm your order details.',
            description: settings?.thankYouPage?.description || ''
        }
    });

    const handleSave = () => {
        updateSettings({ ...settings, ...localSettings } as any);
        showToast('Thank You Page settings saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Thank You Page</h1>
                    <p className="text-xs text-gray-400 font-bold">Customize the post-checkout screen</p>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Page Content</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Title</label>
                    <input
                        type="text"
                        value={localSettings.thankYouPage.title}
                        onChange={e => setLocalSettings({ ...localSettings, thankYouPage: { ...localSettings.thankYouPage, title: e.target.value } })}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                        placeholder="Order Placed Successfully!"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Subtitle</label>
                    <textarea
                        value={localSettings.thankYouPage.subtitle}
                        onChange={e => setLocalSettings({ ...localSettings, thankYouPage: { ...localSettings.thankYouPage, subtitle: e.target.value } })}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-medium text-sm h-24 resize-none"
                        placeholder="Thank you for shopping with us!"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Additional Description (Optional)</label>
                    <textarea
                        value={localSettings.thankYouPage.description}
                        onChange={e => setLocalSettings({ ...localSettings, thankYouPage: { ...localSettings.thankYouPage, description: e.target.value } })}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-medium text-sm h-24 resize-none"
                        placeholder="Any extra instructions or information..."
                    />
                </div>
            </div>

            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Thank You Page</button>
        </div>
    );
};
