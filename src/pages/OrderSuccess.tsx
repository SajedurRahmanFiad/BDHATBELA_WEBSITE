import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Phone } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { trackPurchase as trackGA4Purchase } from '../utils/ga4';
import { Order } from '../types';
import { API_BASE_URL } from '../constants';

export const OrderSuccess: React.FC = () => {
    const { id } = useParams();
    const { settings, orders } = useAdmin();
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!id) return;

        const existingOrder = orders.find(o => o.id === id);
        if (existingOrder) {
            setOrder(existingOrder);
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/orders.php?id=${encodeURIComponent(id)}`);
                if (!response.ok) return;
                const orderData = await response.json();
                setOrder(orderData);
            } catch (error) {
                console.error('Failed to load order details', error);
            }
        };

        fetchOrder();
    }, [id, orders]);

    useEffect(() => {
        if (!order) return;

        const purchaseItems = order.items.map(item => ({
            id: item.variation?.sku ?? item.product.sku ?? item.variation?.id ?? item.product.id,
            name: item.variation ? `${item.product.name} (${item.variation.name})` : item.product.name,
            price: item.variation?.price ?? item.product.price,
            quantity: item.quantity,
            category: item.product.category,
            sku: item.variation?.sku ?? item.product.sku,
            stock: item.variation?.stock ?? item.product.stock,
            productType: item.variation ? 'variation' : item.product.productType || 'simple',
            itemBrand: item.product.badge || undefined,
            index: 1,
            affiliation: window.location.hostname,
            googleBusinessVertical: 'retail',
        }));

        trackGA4Purchase({
            id: order.id,
            customerId: order.customerId,
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            area: order.area,
            paymentMethod: order.paymentMethod,
            note: order.note,
            items: purchaseItems,
            total: order.total,
            coupon: order.couponCode ?? undefined,
            shipping: undefined,
            tax: undefined,
        });
    }, [order]);

    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-white p-10 md:p-16 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center gap-8">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle size={48} />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{settings?.thankYouPage?.title || 'Order Placed Successfully!'}</h1>
                    <p className="text-gray-500 italic max-w-sm mx-auto font-medium">{settings?.thankYouPage?.subtitle || 'Thank you for shopping with us! Our customer representative will contact you shortly to confirm your order details.'}</p>
                    {settings?.thankYouPage?.description && (
                        <p className="text-gray-500 max-w-sm mx-auto text-sm">{settings.thankYouPage.description}</p>
                    )}
                </div>

                <div className="w-full bg-gray-50 rounded-2xl p-6 space-y-3">
                    <p className="font-bold text-gray-400 text-xs uppercase tracking-widest">Order Tracking ID</p>
                    <p className="text-2xl font-black text-primary">{id?.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <Link to="/products" className="bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                        Continue Shopping <ArrowRight size={18} />
                    </Link>
                    <a href={`tel:${settings.contactPhone}`} className="bg-white border-2 border-primary text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
                        <Phone size={18} /> Helpline Support
                    </a>
                </div>
            </div>
        </div>
    );
};
