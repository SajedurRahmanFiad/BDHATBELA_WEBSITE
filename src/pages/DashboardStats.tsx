import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../AdminContext';
import { OrderStatus, Product } from '../types';
import { DateFilterBar, DateFilterResult } from '../components/DateFilterBar';
import { toFiniteNumber } from '../utils/money';
import {
    TrendingUp, Clock, AlertCircle, ShoppingBag,
    BarChart3, Activity, Package, Layers
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const DashboardStats = () => {
    const { products, orders } = useAdmin();
    const navigate = useNavigate();

    // Default to 'Today'
    const [dateFilter, setDateFilter] = useState<DateFilterResult | null>(null);
    const [trendDays, setTrendDays] = useState<7 | 30>(7);

    // 1. Filtered Orders for KPIs
    const filteredOrders = useMemo(() => {
        const filtered = !dateFilter || dateFilter.type === 'All' ? orders : orders.filter(o => {
            const d = new Date(o.date);
            if (dateFilter.startDate && d < dateFilter.startDate) return false;
            if (dateFilter.endDate && d > dateFilter.endDate) return false;
            return true;
        });

        return filtered.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED);
    }, [orders, dateFilter]);

    // KPIs
    const totalSales = filteredOrders.reduce((sum, o) => sum + toFiniteNumber(o.total), 0);
    const totalOrdersCount = filteredOrders.length;
    const pendingOrdersCount = filteredOrders.filter(o => o.status === OrderStatus.PENDING).length;
    // For insights list we use < 10 (which includes 0). The prompt says merge them.
    const lowStockProducts = products.filter(p => toFiniteNumber(p.stock) < 10);

    // 2. Trend Charts (Last 7/30 days, ignores DateFilterBar)
    const trendData = useMemo(() => {
        const dataMap: Record<string, { date: string, sales: number, orders: number }> = {};
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = trendDays - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dataMap[key] = { date: key, sales: 0, orders: 0 };
        }

        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - (trendDays - 1));

        orders.forEach(o => {
            if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED) return;
            const od = new Date(o.date);
            if (od >= cutoffDate) {
                const key = od.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (dataMap[key]) {
                    dataMap[key].sales += toFiniteNumber(o.total);
                    dataMap[key].orders += 1;
                }
            }
        });

        return Object.values(dataMap);
    }, [orders, trendDays]);

    // 3. Product Insights
    const topSellingProducts = useMemo(() => {
        const salesMap: Record<string, { product: Product, quantity: number }> = {};
        orders.forEach(o => {
            if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED) return;
            o.items.forEach(item => {
                if (!salesMap[item.product.id]) {
                    salesMap[item.product.id] = { product: item.product, quantity: 0 };
                }
                salesMap[item.product.id].quantity += toFiniteNumber(item.quantity);
            });
        });
        return Object.values(salesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [orders]);

    const topCategories = useMemo(() => {
        const catMap: Record<string, { name: string, quantity: number }> = {};
        orders.forEach(o => {
            if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED) return;
            o.items.forEach(item => {
                const cat = item.product.category || 'Uncategorized';
                if (!catMap[cat]) {
                    catMap[cat] = { name: cat, quantity: 0 };
                }
                catMap[cat].quantity += toFiniteNumber(item.quantity);
            });
        });
        return Object.values(catMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [orders]);

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Overview Dashboard</h1>
                    <p className="text-xs text-gray-400 font-bold">Realtime statistics overview of your online shop</p>
                </div>
            </header>

            <DateFilterBar onFilterChange={setDateFilter} defaultFilter="Today" />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                    onClick={() => navigate('/admin/analytics')}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                            <TrendingUp size={14} />
                        </div>
                        <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Total Sales</h3>
                    </div>
                    <p className="text-2xl font-black text-gray-900">৳{totalSales.toLocaleString()}</p>
                </div>
                <div
                    onClick={() => navigate('/admin/orders')}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                            <ShoppingBag size={14} />
                        </div>
                        <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Total Orders</h3>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{totalOrdersCount}</p>
                </div>
                <div
                    onClick={() => navigate('/admin/orders', { state: { status: OrderStatus.PENDING } })}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                            <Clock size={14} />
                        </div>
                        <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Pending Orders</h3>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{pendingOrdersCount}</p>
                </div>
                <div
                    onClick={() => navigate('/admin/products')}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <AlertCircle size={14} />
                        </div>
                        <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Low Stock Products</h3>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{lowStockProducts.length}</p>
                </div>
            </div>

            {/* Quick Charts */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="font-bold text-lg">Trend Analysis</h2>
                        <p className="text-xs text-gray-500">Sales and Orders over the last {trendDays} days</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl self-start">
                        <button
                            onClick={() => setTrendDays(7)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${trendDays === 7 ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setTrendDays(30)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${trendDays === 30 ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            30 Days
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sales Trend */}
                    <div className="min-h-[300px]">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-green-500" /> Sales Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Orders Trend */}
                    <div className="min-h-[300px]">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <BarChart3 size={16} className="text-blue-500" /> Orders Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Product Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Selling Products */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" /> Top Selling
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-80">
                        {topSellingProducts.length > 0 ? topSellingProducts.map((item, idx) => (
                            <div key={item.product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0">
                                <div className="font-black text-gray-300 w-4">{idx + 1}</div>
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border bg-gray-100">
                                    {item.product.images?.[0] ? <img src={item.product.images[0]} className="w-full h-full object-cover" alt="" /> : <Package className="m-auto mt-2 text-gray-400" size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{item.product.name}</p>
                                    <p className="text-xs text-gray-500">{item.quantity} sold</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-400 italic">No sales data yet.</p>}
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Layers size={20} className="text-blue-500" /> Top Categories
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-80">
                        {topCategories.length > 0 ? topCategories.map((cat, idx) => (
                            <div key={cat.name} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0">
                                <div className="font-black text-gray-300 w-4">{idx + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{cat.name}</p>
                                    <p className="text-xs text-gray-500">{cat.quantity} items sold</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-400 italic">No category data yet.</p>}
                    </div>
                </div>

                {/* Low Stock Products */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-orange-500" /> Low Stock
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-80">
                        {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border bg-gray-100">
                                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : <Package className="m-auto mt-2 text-gray-400" size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{p.name}</p>
                                    <p className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : 'text-orange-500'}`}>{p.stock} left</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-400 italic">No low stock products.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
