import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { MapPin } from 'lucide-react';
import { DISTRICTS } from '../../constants';

export const ShippingSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();

    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        shippingCharges: {
            base: settings?.shippingCharges?.base ?? settings?.shippingCharges?.insideDhaka ?? 0,
            exceptions: Array.isArray(settings?.shippingCharges?.exceptions) ? settings.shippingCharges.exceptions : [],
            dynamicShipping: {
                enabled: settings?.shippingCharges?.dynamicShipping?.enabled ?? false,
                perKgCharge: settings?.shippingCharges?.dynamicShipping?.perKgCharge ?? 0,
                startKg: settings?.shippingCharges?.dynamicShipping?.startKg ?? 0
            },
            insideDhaka: settings?.shippingCharges?.insideDhaka,
            outsideDhaka: settings?.shippingCharges?.outsideDhaka
        }
    });

    const handleSave = () => {
        updateSettings({ ...settings, ...localSettings } as any);
        showToast('Shipping Settings saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Shipping</h1>
                    <p className="text-xs text-gray-400 font-bold">Configure delivery rules and charges</p>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <MapPin size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Delivery and Shipping Charges</h2>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">General Shipping Charge for All Districts (৳)</label>
                    <input
                        value={localSettings.shippingCharges.base}
                        type="number"
                        onChange={e => setLocalSettings({
                            ...localSettings,
                            shippingCharges: {
                                ...localSettings.shippingCharges,
                                base: Number(e.target.value)
                            }
                        })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">District Exceptions</h3>
                            <p className="text-xs text-gray-500">Create custom charge overrides for specific districts.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLocalSettings({
                                ...localSettings,
                                shippingCharges: {
                                    ...localSettings.shippingCharges,
                                    exceptions: [
                                        ...localSettings.shippingCharges.exceptions,
                                        { district: DISTRICTS[0] || 'Dhaka', charge: 0 }
                                    ]
                                }
                            })}
                            className="px-4 py-2 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#c52929] transition-all"
                        >+ Add Exception</button>
                    </div>

                    <div className="space-y-4">
                        {localSettings.shippingCharges.exceptions.map((exception: any, index: number) => (
                            <div key={`${exception.district}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_auto] gap-3 items-center">
                                <select
                                    value={exception.district}
                                    onChange={e => {
                                        const newExceptions = [...localSettings.shippingCharges.exceptions];
                                        newExceptions[index] = { ...newExceptions[index], district: e.target.value };
                                        setLocalSettings({
                                            ...localSettings,
                                            shippingCharges: {
                                                ...localSettings.shippingCharges,
                                                exceptions: newExceptions
                                            }
                                        });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none text-sm font-bold"
                                >
                                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input
                                    value={exception.charge}
                                    type="number"
                                    min="0"
                                    onChange={e => {
                                        const newExceptions = [...localSettings.shippingCharges.exceptions];
                                        newExceptions[index] = { ...newExceptions[index], charge: Number(e.target.value) };
                                        setLocalSettings({
                                            ...localSettings,
                                            shippingCharges: {
                                                ...localSettings.shippingCharges,
                                                exceptions: newExceptions
                                            }
                                        });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none text-sm font-bold font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newExceptions = localSettings.shippingCharges.exceptions.filter((_: any, i: number) => i !== index);
                                        setLocalSettings({
                                            ...localSettings,
                                            shippingCharges: {
                                                ...localSettings.shippingCharges,
                                                exceptions: newExceptions
                                            }
                                        });
                                    }}
                                    className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all"
                                >Remove</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between border p-4 rounded-3xl bg-gray-50">
                        <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Dynamic Shipping by Weight</h3>
                            <p className="text-xs text-gray-500">Charge extra shipping based on total product weight.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.shippingCharges.dynamicShipping.enabled}
                            onChange={e => setLocalSettings({
                                ...localSettings,
                                shippingCharges: {
                                    ...localSettings.shippingCharges,
                                    dynamicShipping: {
                                        ...localSettings.shippingCharges.dynamicShipping,
                                        enabled: e.target.checked
                                    }
                                }
                            })}
                            className="w-5 h-5 accent-primary cursor-pointer"
                        />
                    </div>

                    {localSettings.shippingCharges.dynamicShipping.enabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Start Extra Shipping After (Kg)</label>
                                <input
                                    value={localSettings.shippingCharges.dynamicShipping.startKg}
                                    type="number"
                                    min="0"
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        shippingCharges: {
                                            ...localSettings.shippingCharges,
                                            dynamicShipping: {
                                                ...localSettings.shippingCharges.dynamicShipping,
                                                startKg: Number(e.target.value)
                                            }
                                        }
                                    })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Extra Charge Per 1 Kg (৳)</label>
                                <input
                                    value={localSettings.shippingCharges.dynamicShipping.perKgCharge}
                                    type="number"
                                    min="0"
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        shippingCharges: {
                                            ...localSettings.shippingCharges,
                                            dynamicShipping: {
                                                ...localSettings.shippingCharges.dynamicShipping,
                                                perKgCharge: Number(e.target.value)
                                            }
                                        }
                                    })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Shipping Fees</button>
        </div>
    );
};
