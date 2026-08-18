import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { Sparkles, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const defaultFeatures = {
    enabled: true,
    backgroundColor: '#1E3A8A',
    textColor: '#FFFFFF',
    heading: 'Why Shop With Us?',
    description: 'We prioritize customer satisfaction and guarantee high-quality product reliability.',
    features: [
        {
            icon: '🚚',
            title: 'Super Fast Delivery',
            description: 'Get fast and reliable delivery straight to your doorstep right after order confirmation.'
        },
        {
            icon: '🛡️',
            title: 'Secure Payments',
            description: 'Check out securely using bKash, Nagad, bank transfers, or Cash on Delivery.'
        },
        {
            icon: '✨',
            title: 'Premium Quality',
            description: 'Every item undergoes rigorous quality inspections before being dispatched.'
        },
        {
            icon: '💬',
            title: '24/7 Support',
            description: 'Our dedicated customer service team is always here to assist with any questions.'
        }
    ]
};

export const HomepageFeaturesSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();

    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        homepageFeatures: {
            enabled: settings?.homepageFeatures?.enabled ?? defaultFeatures.enabled,
            backgroundColor: settings?.homepageFeatures?.backgroundColor || defaultFeatures.backgroundColor,
            textColor: settings?.homepageFeatures?.textColor || defaultFeatures.textColor,
            heading: settings?.homepageFeatures?.heading || defaultFeatures.heading,
            description: settings?.homepageFeatures?.description || defaultFeatures.description,
            features: settings?.homepageFeatures?.features?.length
                ? settings.homepageFeatures.features.map(f => ({ ...f }))
                : defaultFeatures.features.map(f => ({ ...f }))
        }
    });

    const setFeatures = (features: typeof defaultFeatures.features) => {
        setLocalSettings(prev => ({
            ...prev,
            homepageFeatures: { ...prev.homepageFeatures, features }
        }));
    };

    const updateFeature = (index: number, field: 'icon' | 'title' | 'description', value: string) => {
        const features = localSettings.homepageFeatures.features.map((f, i) => i === index ? { ...f, [field]: value } : f);
        setFeatures(features);
    };

    const moveFeature = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= localSettings.homepageFeatures.features.length) return;
        const features = [...localSettings.homepageFeatures.features];
        [features[index], features[target]] = [features[target], features[index]];
        setFeatures(features);
    };

    const removeFeature = (index: number) => {
        setFeatures(localSettings.homepageFeatures.features.filter((_, i) => i !== index));
    };

    const addFeature = () => {
        setFeatures([...localSettings.homepageFeatures.features, { icon: '⭐', title: '', description: '' }]);
    };

    const handleSave = () => {
        updateSettings({ ...settings, ...localSettings } as any);
        showToast('Homepage Features saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-3xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Homepage Features</h1>
                    <p className="text-xs text-gray-400 font-bold">Edit the "Why Shop With Us?" section on the homepage</p>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Sparkles size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Store Advantage Section</h2>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-sm text-gray-800">Show section on homepage</h3>
                    <p className="text-xs text-gray-500">Enable or disable the store advantage section.</p>
                </div>
                <input
                    type="checkbox"
                    checked={localSettings.homepageFeatures.enabled}
                    onChange={e => setLocalSettings({
                        ...localSettings,
                        homepageFeatures: { ...localSettings.homepageFeatures, enabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-primary cursor-pointer"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Background Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={localSettings.homepageFeatures.backgroundColor}
                            onChange={e => setLocalSettings({
                                ...localSettings,
                                homepageFeatures: { ...localSettings.homepageFeatures, backgroundColor: e.target.value }
                            })}
                            className="w-12 h-12 rounded-lg border cursor-pointer p-1"
                        />
                        <input
                            type="text"
                            value={localSettings.homepageFeatures.backgroundColor}
                            onChange={e => setLocalSettings({
                                ...localSettings,
                                homepageFeatures: { ...localSettings.homepageFeatures, backgroundColor: e.target.value }
                            })}
                            className="flex-1 bg-white border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl outline-none transition-all font-mono text-sm font-bold"
                            placeholder="#1E3A8A"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Text Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={localSettings.homepageFeatures.textColor}
                            onChange={e => setLocalSettings({
                                ...localSettings,
                                homepageFeatures: { ...localSettings.homepageFeatures, textColor: e.target.value }
                            })}
                            className="w-12 h-12 rounded-lg border cursor-pointer p-1"
                        />
                        <input
                            type="text"
                            value={localSettings.homepageFeatures.textColor}
                            onChange={e => setLocalSettings({
                                ...localSettings,
                                homepageFeatures: { ...localSettings.homepageFeatures, textColor: e.target.value }
                            })}
                            className="flex-1 bg-white border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl outline-none transition-all font-mono text-sm font-bold"
                            placeholder="#FFFFFF"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Section Heading</label>
                <input
                    type="text"
                    value={localSettings.homepageFeatures.heading}
                    onChange={e => setLocalSettings({
                        ...localSettings,
                        homepageFeatures: { ...localSettings.homepageFeatures, heading: e.target.value }
                    })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                    placeholder="Why Shop With Us?"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Section Description</label>
                <textarea
                    value={localSettings.homepageFeatures.description}
                    onChange={e => setLocalSettings({
                        ...localSettings,
                        homepageFeatures: { ...localSettings.homepageFeatures, description: e.target.value }
                    })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-medium text-sm h-24 resize-none"
                    placeholder="We prioritize customer satisfaction and guarantee high-quality product reliability."
                />
            </div>

            <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">Feature Items</h3>
                    <button
                        onClick={addFeature}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
                    >
                        <Plus size={16} /> Add Feature
                    </button>
                </div>
                {localSettings.homepageFeatures.features.length === 0 && (
                    <p className="text-sm text-gray-400 font-bold text-center py-6">No features yet. Click "Add Feature" to create one.</p>
                )}
                {localSettings.homepageFeatures.features.map((feature, index) => (
                    <div key={index} className="bg-gray-50 border rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Feature #{index + 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => moveFeature(index, -1)}
                                    disabled={index === 0}
                                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Move up"
                                >
                                    <ArrowUp size={15} />
                                </button>
                                <button
                                    onClick={() => moveFeature(index, 1)}
                                    disabled={index === localSettings.homepageFeatures.features.length - 1}
                                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Move down"
                                >
                                    <ArrowDown size={15} />
                                </button>
                                <button
                                    onClick={() => removeFeature(index)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 cursor-pointer"
                                    title="Remove feature"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-[110px_1fr] gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Icon</label>
                                <input
                                    type="text"
                                    value={feature.icon}
                                    onChange={e => updateFeature(index, 'icon', e.target.value)}
                                    className="w-full bg-white border border-gray-200 focus:border-primary px-3 py-2.5 rounded-xl outline-none transition-all text-center text-2xl"
                                    placeholder="🚚"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Title</label>
                                <input
                                    type="text"
                                    value={feature.title}
                                    onChange={e => updateFeature(index, 'title', e.target.value)}
                                    className="w-full bg-white border border-gray-200 focus:border-primary px-4 py-2.5 rounded-xl outline-none transition-all font-bold text-sm"
                                    placeholder="Super Fast Delivery"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Description</label>
                            <textarea
                                value={feature.description}
                                onChange={e => updateFeature(index, 'description', e.target.value)}
                                className="w-full bg-white border border-gray-200 focus:border-primary px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm h-20 resize-none"
                                placeholder="Short description for this feature..."
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Homepage Features</button>
        </div>
    );
};