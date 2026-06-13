import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { CreditCard } from 'lucide-react';

export const GatewaySettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();

    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        paymentGateways: {
            cod: { enabled: !!settings?.paymentGateways?.cod?.enabled },
            bkash: {
                enabled: !!settings?.paymentGateways?.bkash?.enabled,
                number: settings?.paymentGateways?.bkash?.number || '',
                type: settings?.paymentGateways?.bkash?.type || 'Personal',
                instructions: settings?.paymentGateways?.bkash?.instructions || ''
            },
            nagad: {
                enabled: !!settings?.paymentGateways?.nagad?.enabled,
                number: settings?.paymentGateways?.nagad?.number || '',
                type: settings?.paymentGateways?.nagad?.type || 'Personal',
                instructions: settings?.paymentGateways?.nagad?.instructions || ''
            },
            rocket: {
                enabled: !!settings?.paymentGateways?.rocket?.enabled,
                number: settings?.paymentGateways?.rocket?.number || '',
                type: settings?.paymentGateways?.rocket?.type || 'Personal',
                instructions: settings?.paymentGateways?.rocket?.instructions || ''
            },
            bank: {
                enabled: !!settings?.paymentGateways?.bank?.enabled,
                bankName: settings?.paymentGateways?.bank?.bankName || '',
                branchName: settings?.paymentGateways?.bank?.branchName || '',
                accountName: settings?.paymentGateways?.bank?.accountName || '',
                accountNumber: settings?.paymentGateways?.bank?.accountNumber || '',
                instructions: settings?.paymentGateways?.bank?.instructions || ''
            }
        }
    });

    const handleSave = () => {
        updateSettings({ ...settings, ...localSettings } as any);
        showToast('Gateways saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-8 max-w-2xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Gateways</h1>
                    <p className="text-xs text-gray-400 font-bold">Configure payment methods</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <CreditCard size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Gateway Configurations</h2>
            </div>

            {/* Cash On Delivery toggle */}
            <div className="bg-gray-50 p-6 rounded-2xl flex items-center justify-between border">
                <div>
                    <h3 className="font-bold text-sm text-gray-800">Cash on Delivery (COD)</h3>
                    <p className="text-xs text-gray-500">Pay inside/outside districts with raw cash upon package handover.</p>
                </div>
                <input
                    type="checkbox"
                    checked={localSettings.paymentGateways.cod.enabled}
                    onChange={e => setLocalSettings({
                        ...localSettings,
                        paymentGateways: {
                            ...localSettings.paymentGateways,
                            cod: { enabled: e.target.checked }
                        }
                    })}
                    className="w-5 h-5 accent-primary cursor-pointer"
                />
            </div>

            {/* Mobile Wallets */}
            {['bkash', 'nagad', 'rocket'].map(gateway => {
                const gw = (localSettings.paymentGateways as any)[gateway];
                return (
                    <div key={gateway} className="border p-6 rounded-2xl space-y-4 bg-white relative">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">{gateway} Payment Option</h3>
                            <input
                                type="checkbox"
                                checked={gw.enabled}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    paymentGateways: {
                                        ...localSettings.paymentGateways,
                                        [gateway]: { ...gw, enabled: e.target.checked }
                                    }
                                })}
                                className="w-4 h-4 accent-primary cursor-pointer"
                            />
                        </div>
                        {gw.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 md:text-right">{gateway} Account Number</label>
                                    <input
                                        value={gw.number}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            paymentGateways: {
                                                ...localSettings.paymentGateways,
                                                [gateway]: { ...gw, number: e.target.value }
                                            }
                                        })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold font-mono"
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Wallet Account Type</label>
                                    <select
                                        value={gw.type}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            paymentGateways: {
                                                ...localSettings.paymentGateways,
                                                [gateway]: { ...gw, type: e.target.value as any }
                                            }
                                        })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-xs font-bold text-gray-600 uppercase bg-white"
                                    >
                                        <option value="Personal">Personal</option>
                                        <option value="Agent">Agent</option>
                                        <option value="Merchant">Merchant</option>
                                    </select>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Checkout Instructions</label>
                                    <input
                                        value={gw.instructions}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            paymentGateways: {
                                                ...localSettings.paymentGateways,
                                                [gateway]: { ...gw, instructions: e.target.value }
                                            }
                                        })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none text-sm leading-relaxed"
                                        placeholder="e.g. Please use cashout or sendmoney with transaction ID inputs."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bank Transfer Gateway */}
            <div className="border p-6 rounded-2xl space-y-4 bg-white">
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Direct Bank Wire</h3>
                    <input
                        type="checkbox"
                        checked={localSettings.paymentGateways.bank.enabled}
                        onChange={e => setLocalSettings({
                            ...localSettings,
                            paymentGateways: {
                                ...localSettings.paymentGateways,
                                bank: { ...localSettings.paymentGateways.bank, enabled: e.target.checked }
                            }
                        })}
                        className="w-4 h-4 accent-primary cursor-pointer"
                    />
                </div>
                {localSettings.paymentGateways.bank.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                            <input
                                value={localSettings.paymentGateways.bank.bankName}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    paymentGateways: {
                                        ...localSettings.paymentGateways,
                                        bank: { ...localSettings.paymentGateways.bank, bankName: e.target.value }
                                    }
                                })}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold"
                                placeholder="E.g. City Bank"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch Name</label>
                            <input
                                value={localSettings.paymentGateways.bank.branchName}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    paymentGateways: {
                                        ...localSettings.paymentGateways,
                                        bank: { ...localSettings.paymentGateways.bank, branchName: e.target.value }
                                    }
                                })}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold"
                                placeholder="E.g. Gulshan Branch"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Name</label>
                            <input
                                value={localSettings.paymentGateways.bank.accountName}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    paymentGateways: {
                                        ...localSettings.paymentGateways,
                                        bank: { ...localSettings.paymentGateways.bank, accountName: e.target.value }
                                    }
                                })}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold uppercase"
                                placeholder="E.g. MY SHOP LTD"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                            <input
                                value={localSettings.paymentGateways.bank.accountNumber}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    paymentGateways: {
                                        ...localSettings.paymentGateways,
                                        bank: { ...localSettings.paymentGateways.bank, accountNumber: e.target.value }
                                    }
                                })}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold font-mono tracking-widest"
                                placeholder="XXXXXXXXXXXXXXXX"
                            />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Checkout Instructions</label>
                            <input
                                value={localSettings.paymentGateways.bank.instructions}
                                onChange={e => setLocalSettings({
                                    ...localSettings,
                                    paymentGateways: {
                                        ...localSettings.paymentGateways,
                                        bank: { ...localSettings.paymentGateways.bank, instructions: e.target.value }
                                    }
                                })}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none text-sm leading-relaxed"
                                placeholder="e.g. Deposit to our Bank account and upload the deposit receipt slip."
                            />
                        </div>
                    </div>
                )}
            </div>

            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Gateways</button>
        </div>
    );
};
