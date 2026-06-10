import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Phone } from 'lucide-react';
import { useAdmin } from '../AdminContext';

export const OrderSuccess: React.FC = () => {
    const { id } = useParams();
    const { settings } = useAdmin();

    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-white p-10 md:p-16 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center gap-8">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle size={48} />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Order Placed Successfully!</h1>
                    <p className="text-gray-500 italic max-w-sm mx-auto">Thank you for shopping with us! Our customer representative will contact you shortly to confirm your order details.</p>
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
