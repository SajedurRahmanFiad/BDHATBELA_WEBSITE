import React, { useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { DateFilterBar, DateFilterResult } from '../components/DateFilterBar';
import { OrderStatus, Order, StoreSettings } from '../types';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Activity, Package, Receipt } from 'lucide-react';

const calculateOrderShippingCost = (order: Order, settings: StoreSettings) => {
    if (!settings || !settings.shippingCharges) return 0;
    const shippingBase = settings.shippingCharges.base ?? 0;
    const hasBase = settings.shippingCharges.base !== undefined && settings.shippingCharges.base !== null;
    const legacyBase = order.area === 'Dhaka'
        ? settings.shippingCharges.insideDhaka
        : settings.shippingCharges.outsideDhaka;
    const defaultCharge = hasBase ? shippingBase : (legacyBase ?? 0);

    const exceptionCharge = Array.isArray(settings.shippingCharges.exceptions)
        ? settings.shippingCharges.exceptions.find(ex => ex.district === order.area)?.charge
        : undefined;

    const districtShippingCost = exceptionCharge ?? defaultCharge;

    const totalWeight = order.items.reduce((sum, item) => {
        const w = item.variation?.weight ?? item.product?.weight ?? 0;
        return sum + (w * item.quantity);
    }, 0);

    const dynamicStartKg = settings.shippingCharges.dynamicShipping?.startKg ?? 1;
    const extraWeightCharge = settings.shippingCharges.dynamicShipping?.enabled
        ? Math.max(totalWeight - dynamicStartKg, 0) * (settings.shippingCharges.dynamicShipping?.perKgCharge ?? 0)
        : 0;

    return districtShippingCost + extraWeightCharge;
};

export const AdminAnalytics = () => {
    const { orders, settings } = useAdmin();
    const [dateFilter, setDateFilter] = React.useState<DateFilterResult | null>(null);

    const filteredOrders = useMemo(() => {
        if (!dateFilter || dateFilter.type === 'All') {
            return orders.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED);
        }
        return orders.filter(o => {
            if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED) return false;
            const d = new Date(o.date);
            if (dateFilter.startDate && d < dateFilter.startDate) return false;
            if (dateFilter.endDate && d > dateFilter.endDate) return false;
            return true;
        });
    }, [orders, dateFilter]);

    // Metrics Calculation
    const {
        grossSales,
        totalShipping,
        totalCostOfGoods,
    } = useMemo(() => {
        let grossSales = 0;
        let totalShipping = 0;
        let totalCostOfGoods = 0;

        filteredOrders.forEach(order => {
            grossSales += order.total;
            
            const shipping = settings ? calculateOrderShippingCost(order, settings) : 0;
            totalShipping += shipping;

            let orderCog = 0;
            order.items.forEach(item => {
                const cog = item.variation?.costOfGoods ?? item.product?.costOfGoods ?? 0;
                orderCog += (cog * item.quantity);
            });
            totalCostOfGoods += orderCog;
        });

        return { grossSales, totalShipping, totalCostOfGoods };
    }, [filteredOrders, settings]);

    const monthlyData = useMemo(() => {
        const monthMap: Record<string, { month: string, revenue: number, expenses: number }> = {};

        orders.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED).forEach(order => {
            const shipping = settings ? calculateOrderShippingCost(order, settings) : 0;
            
            let orderCog = 0;
            order.items.forEach(item => {
                const cog = item.variation?.costOfGoods ?? item.product?.costOfGoods ?? 0;
                orderCog += (cog * item.quantity);
            });

            const orderDate = new Date(order.date);
            const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = orderDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            if (!monthMap[monthKey]) {
                monthMap[monthKey] = { month: monthLabel, revenue: 0, expenses: 0 };
            }
            monthMap[monthKey].revenue += order.total;
            monthMap[monthKey].expenses += (shipping + orderCog);
        });

        return Object.keys(monthMap).sort().map(key => monthMap[key]);
    }, [orders, settings]);

    const totalExpenses = totalShipping + totalCostOfGoods;
    const netSales = grossSales; // or grossSales - something else if needed, but per prompt Net Sales = Gross - Expenses
    // "Net Sales: Gross Sales - Total Expenses" -> According to your spec, wait let's use standard definitions
    // "Gross Profit = Revenue - Cost of Goods"
    const grossProfit = grossSales - totalCostOfGoods;
    // "Net Profit = Net Sales" -> I assume you meant Net Profit = Gross Profit - Expenses (shipping)
    const netProfit = grossSales - totalExpenses;
    const profitMargin = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(2) : '0.00';

    const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon size={14} />
                    </div>
                    <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">{title}</h3>
                </div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
            </div>
            {subtitle && <p className="text-xs text-gray-500 font-medium mt-3 border-t pt-2">{subtitle}</p>}
        </div>
    );

    return (
        <div className="space-y-6 pb-32">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Analytics & Reports</h1>
                <DateFilterBar onFilterChange={setDateFilter} defaultFilter="Today" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Gross Sales" 
                    value={`৳${grossSales.toLocaleString()}`} 
                    icon={DollarSign} 
                    colorClass="bg-green-50 text-green-500" 
                    subtitle="Total revenue collected"
                />
                <StatCard 
                    title="Net Sales" 
                    value={`৳${netProfit.toLocaleString()}`} 
                    icon={Activity} 
                    colorClass="bg-blue-50 text-blue-500" 
                    subtitle="Gross Sales minus Total Expenses"
                />
                <StatCard 
                    title="Total Expenses" 
                    value={`৳${totalExpenses.toLocaleString()}`} 
                    icon={Receipt} 
                    colorClass="bg-red-50 text-red-500" 
                    subtitle={`COG: ৳${totalCostOfGoods.toLocaleString()} + Shipping: ৳${totalShipping.toLocaleString()}`}
                />
                <StatCard 
                    title="Gross Profit" 
                    value={`৳${grossProfit.toLocaleString()}`} 
                    icon={TrendingUp} 
                    colorClass="bg-emerald-50 text-emerald-500" 
                    subtitle="Gross Sales minus Cost of Goods"
                />
                <StatCard 
                    title="Net Profit" 
                    value={`৳${netProfit.toLocaleString()}`} 
                    icon={Package} 
                    colorClass="bg-purple-50 text-purple-500" 
                    subtitle="Final profit after all expenses"
                />
                <StatCard 
                    title="Profit Margin" 
                    value={`${profitMargin}%`} 
                    icon={netProfit >= 0 ? TrendingUp : TrendingDown} 
                    colorClass={netProfit >= 0 ? "bg-teal-50 text-teal-500" : "bg-red-50 text-red-500"} 
                    subtitle="Net Profit / Gross Sales"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue vs Expenses Area Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h2 className="font-bold text-lg mb-6">Revenue vs Expenses</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Revenue Breakdown Bar Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h2 className="font-bold text-lg mb-6">Monthly Revenue Breakdown</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Profit Trend Line Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px] lg:col-span-2">
                    <h2 className="font-bold text-lg mb-6">Profit Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData.map(d => ({ ...d, profit: d.revenue - d.expenses }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#8b5cf6" strokeWidth={4} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
