import React from 'react';
import { useAdmin } from '../../AdminContext';
import { useCart } from '../../CartContext';
import { ListOrdered } from 'lucide-react';

export const OrdersSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();
    const [orderIdPrefix, setOrderIdPrefix] = React.useState(settings?.orders?.orderIdPrefix || 'order');

    const handleSave = () => {
        const prefix = orderIdPrefix.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '') || 'order';
        updateSettings({
            ...settings,
            orders: {
                ...(settings?.orders || {}),
                orderIdPrefix: prefix
            }
        } as any);
        showToast('Order Settings saved successfully!');
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">Orders</h1>
                    <p className="text-xs text-gray-400 font-bold">Configure order numbering preferences</p>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <ListOrdered size={20} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Order ID Prefix</h2>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Prefix used in new order IDs</label>
                <input
                    value={orderIdPrefix}
                    onChange={e => setOrderIdPrefix(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                    placeholder="order"
                />
                <p className="text-xs text-gray-500 font-bold ml-1">New checkout orders will use this prefix, for example: {orderIdPrefix.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '') || 'order'}-1718880000000</p>
            </div>

            <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Order Settings</button>
        </div>
    );
};
