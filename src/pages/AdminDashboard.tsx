import React from 'react';
import { useAdmin } from '../AdminContext';
import { useCart } from '../CartContext';
import {
    LayoutDashboard, ShoppingBag, ListOrdered, Settings,
    Users, AlertCircle, TrendingUp,
    Package, Clock, CheckCircle, CheckCircle2, Search, Filter,
    Trash2, Edit3, Eye, ArrowUpDown, ChevronDown, ChevronUp,
    Phone, Mail, MapPin, CreditCard, Upload, X, Menu, MonitorPlay, MessageSquare,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { OrderStatus } from '../types';
import { API_BASE_URL } from '../constants';

export const AdminDashboard: React.FC = () => {
    const { products, orders, settings } = useAdmin();
    const { toast } = useCart();
    const location = useLocation();

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

    if (!settings) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Admin Panel...</div>;
    }

    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;

    const NavItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => {
        const isActive = location.pathname === to || (to === '/admin' && location.pathname === '/admin/');
        return (
            <Link
                to={to}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-red-200' : 'hover:bg-gray-100 text-gray-700'}`}
            >
                <span className="flex items-center gap-3 font-medium text-sm">
                    <Icon size={18} /> {label}
                </span>
                {badge !== undefined && badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                        {badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            <style>{`
        :root {
          --color-primary: ${settings?.primaryColor || '#ef4444'};
        }
      `}</style>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast?.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-4 left-1/2 z-[200] bg-white border border-green-100 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 min-w-[300px]"
                    >
                        <div className="w-8 h-8 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} />
                        </div>
                        <p className="text-sm font-bold text-gray-800">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Top Header for Admin */}
            <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
                    >
                        <Menu size={20} />
                    </button>
                    <img src={settings.logo} className="w-6 h-6 object-contain" alt="" />
                    <span className="font-black text-xs uppercase tracking-tight">Admin <span className="text-primary italic">Panel</span></span>
                </div>
                <Link to="/" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                    <Package size={12} /> Live Site
                </Link>
            </header>

            {/* Sidebar - Desktop static and Mobile slide-out drawer */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r p-6 flex flex-col h-screen transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <img src={settings.logo} className="w-8 h-8 object-contain" alt="" />
                        <span className="font-black text-lg">Admin <span className="text-primary italic">Panel</span></span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex flex-col gap-1" onClick={() => setIsMobileSidebarOpen(false)}>
                    <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/admin/orders" icon={ListOrdered} label="Orders" badge={pendingOrders} />
                    <NavItem to="/admin/categories" icon={Filter} label="Categories" />
                    <NavItem to="/admin/products" icon={ShoppingBag} label="Products" />
                    <NavItem to="/admin/banners" icon={MonitorPlay} label="Banners" />
                    <NavItem to="/admin/settings" icon={Settings} label="Settings" />
                    <NavItem to="/admin/contacts" icon={MessageSquare} label="Contact Messages" />
                    <NavItem to="/admin/staff" icon={Users} label="Staff Management" />
                </nav>

                <div className="mt-auto pt-6 border-t">
                    <Link to="/" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                        <Package size={14} /> Back to Live Website
                    </Link>
                </div>
            </aside>

            {/* Backdrop for Mobile Sidebar Drawer */}
            {isMobileSidebarOpen && (
                <div
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto space-y-8">
                    <Routes>
                        <Route path="/" element={<DashboardStats />} />
                        <Route path="/orders" element={<AdminOrders />} />
                        <Route path="/categories" element={<AdminCategories />} />
                        <Route path="/products" element={<AdminProducts />} />
                        <Route path="/banners" element={<AdminBanners />} />
                        <Route path="/settings" element={<AdminSettings />} />
                        <Route path="/contacts" element={<AdminContacts />} />
                        <Route path="/staff" element={<AdminStaff />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const DashboardStats = () => {
    const { products, orders } = useAdmin();
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const lowStockProducts = products.filter(p => p.stock < 10).length;

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Overview Dashboard</h1>
                    <p className="text-xs text-gray-400 font-bold">Realtime statistics overview of your online shop</p>
                </div>
                <div className="text-xs bg-white px-4 py-2 rounded-lg border font-bold text-gray-500 self-start sm:self-auto">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                    <TrendingUp className="text-green-500" />
                    <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Total Sales</h3>
                    <p className="text-2xl font-black text-gray-900">৳{totalSales}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                    <Clock className="text-orange-500" />
                    <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Pending Orders</h3>
                    <p className="text-2xl font-black text-gray-900">{pendingOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                    <AlertCircle className="text-red-500" />
                    <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Low Stock</h3>
                    <p className="text-2xl font-black text-gray-900">{lowStockProducts}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                    <CheckCircle className="text-blue-500" />
                    <h3 className="text-xs text-gray-400 font-black uppercase tracking-wider">Total Products</h3>
                    <p className="text-2xl font-black text-gray-900">{products.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg mb-6 border-b pb-4">Recent Orders</h2>
                    {orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map(order => (
                                <div key={order.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">#{order.id.split('-')[1] || order.id.slice(-6)}</p>
                                        <p className="text-xs text-gray-400 font-medium">{order.customerName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">৳{order.total}</p>
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-white border rounded-full text-gray-500 uppercase tracking-wider">{order.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-10 text-gray-400 italic text-sm">No new orders found</p>
                    )}
                </div>

                <div className="bg-primary text-white p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10 space-y-2 max-w-sm">
                        <h2 className="text-2xl font-bold">Add a New Product?</h2>
                        <p className="opacity-80 text-sm">Adding new items and collections to your online store is now easier than ever.</p>
                    </div>
                    <Link to="/admin/products" className="relative z-10 inline-block bg-white text-primary px-8 py-3 rounded-full font-bold self-start mt-6 hover:scale-105 transition-all text-sm">
                        Add New Product
                    </Link>
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                        <ShoppingBag size={120} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tighter">{title}</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-all text-sm">Cancel</button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-red-200 hover-primary-dark transition-all text-sm"
                    >Confirm</button>
                </div>
            </div>
        </div>
    );
};

const ImageUpload = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
            <div className="flex items-center gap-4">
                <div className="relative group w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all">
                    {value ? (
                        <>
                            <img src={value} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Edit3 className="text-white" size={20} />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-primary">
                            <Upload size={20} />
                            <span className="text-[8px] font-bold mt-1">Upload</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

const MultiImageUpload = ({ values, onChange, label }: { values: string[], onChange: (vals: string[]) => void, label: string }) => {
    const [isUploading, setIsUploading] = React.useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadedUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://localhost:8000/upload.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.url) {
                    uploadedUrls.push(data.url);
                } else {
                    console.error('Upload failed:', data.error);
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        }

        if (uploadedUrls.length > 0) {
            onChange([...values, ...uploadedUrls]);
        }
        setIsUploading(false);
        e.target.value = '';
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
            <div className="flex flex-wrap gap-4">
                {values.map((val, idx) => (
                    <div key={idx} className="relative w-24 h-24 bg-gray-50 border rounded-2xl overflow-hidden group">
                        {val.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video src={val} className="w-full h-full object-cover" />
                        ) : (
                            <img src={val} className="w-full h-full object-cover" alt="" />
                        )}
                        <button
                            type="button"
                            onClick={() => onChange(values.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                <div className="relative w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all">
                    {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    ) : (
                        <>
                            <Upload size={20} className="text-gray-400" />
                            <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-widest">Media</span>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

const AdminOrders = () => {
    const { orders, updateOrderStatus, deleteOrder } = useAdmin();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('All');
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
    const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null);

    const filteredOrders = orders
        .filter(o => {
            const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.phone.includes(searchTerm) ||
                o.id.includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a: any, b: any) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const toggleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Order Management</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-xl outline-none focus:border-primary w-full md:w-64 text-sm transition-all bg-white"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-xl outline-none focus:border-primary text-sm font-bold bg-white"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Responsive Table Wrap */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest cursor-pointer text-gray-400" onClick={() => toggleSort('id')}>Order ID <ArrowUpDown size={10} className="inline ml-1" /></th>
                                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest cursor-pointer text-gray-400" onClick={() => toggleSort('customerName')}>Customer <ArrowUpDown size={10} className="inline ml-1" /></th>
                                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest cursor-pointer text-gray-400" onClick={() => toggleSort('total')}>Total <ArrowUpDown size={10} className="inline ml-1" /></th>
                                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest cursor-pointer text-gray-400" onClick={() => toggleSort('status')}>Status <ArrowUpDown size={10} className="inline ml-1" /></th>
                                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-bold">#{order.id.split('-')[1] || order.id.slice(-6)}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold">{order.customerName}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{order.phone}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-primary">৳{order.total}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold border uppercase tracking-wider ${order.status === OrderStatus.PENDING ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                order.status === OrderStatus.DELIVERED ? 'bg-green-50 text-green-600 border-green-100' :
                                                    order.status === OrderStatus.CANCELLED ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>{order.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 rounded-lg"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                                className="text-[10px] border rounded-lg p-2 outline-none focus:border-primary font-bold bg-white"
                                            >
                                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button
                                                onClick={() => setOrderToDelete(order.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg sm:opacity-0 group-hover:opacity-100"
                                                title="Delete Order"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredOrders.length === 0 && <p className="text-center py-20 text-gray-400 italic text-sm">No orders found</p>}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 sm:p-8 border-b bg-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold tracking-tighter">Order Details</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Order ID: #{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-2xl text-gray-400 hover:text-black">&times;</button>
                        </div>
                        <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar space-y-8 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Users size={14} /> Customer Info
                                    </h3>
                                    <div className="bg-gray-50 p-6 rounded-3xl space-y-3 border">
                                        <p className="font-black text-lg">{selectedOrder.customerName}</p>
                                        <div className="space-y-2">
                                            <p className="text-sm flex items-center gap-2 text-gray-600"><Phone size={14} /> {selectedOrder.phone}</p>
                                            <p className="text-sm flex items-center gap-2 text-gray-600"><MapPin size={14} /> {selectedOrder.address}, {selectedOrder.area}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard size={14} /> Payment Details
                                    </h3>
                                    <div className="bg-gray-50 p-6 rounded-3xl space-y-3 border">
                                        <p className="text-sm font-bold">Payment Method: <span className="text-primary uppercase font-black">{selectedOrder.paymentMethod}</span></p>
                                        {selectedOrder.note && (
                                            <div className="pt-2">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Customer Note & Payment Info:</p>
                                                <p className="text-sm italic text-gray-600 font-bold p-3 bg-white rounded-xl mt-1 border shadow-inner">
                                                    {selectedOrder.note.includes('TrxID:') ? (
                                                        <>
                                                            <span>{selectedOrder.note.split('|')[0]}</span>
                                                            <br />
                                                            <span className="text-primary not-italic tracking-wider uppercase">{selectedOrder.note.split('|')[1]}</span>
                                                        </>
                                                    ) : (
                                                        selectedOrder.note
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Ordered Items</h3>
                                <div className="border rounded-3xl overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[500px]">
                                            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 border-b">
                                                <tr>
                                                    <th className="px-6 py-3">Product</th>
                                                    <th className="px-6 py-3">Qty</th>
                                                    <th className="px-6 py-3 text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-sm">
                                                {selectedOrder.items.map((item: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 flex items-center gap-3">
                                                            <img src={item.product.images[0]} className="w-10 h-10 object-cover rounded-lg border flex-shrink-0" alt="" />
                                                            <span className="font-bold text-gray-800 line-clamp-1">{item.product.name}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">{item.quantity}</td>
                                                        <td className="px-6 py-4 font-black text-right text-gray-900">৳{item.product.discountPrice || item.product.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-black">
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-4 text-right">Grand Total:</td>
                                                    <td className="px-6 py-4 text-right text-primary text-xl">৳{selectedOrder.total}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 bg-white border border-gray-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-sm"
                            >Print Invoice</button>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-black transition-all text-sm"
                            >Close</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!orderToDelete}
                onClose={() => setOrderToDelete(null)}
                onConfirm={() => deleteOrder(orderToDelete!)}
                title="Delete this Order?"
                message="Are you sure you want to delete this order? This action is irreversible."
            />
        </div>
    );
};

const AdminCategories = () => {
    const { categories, addCategory, updateCategory, deleteCategory } = useAdmin();
    const { showToast } = useCart();
    const [showModal, setShowModal] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<any>(null);
    const [categoryToDelete, setCategoryToDelete] = React.useState<string | null>(null);
    const [newCategory, setNewCategory] = React.useState({
        name: '',
        image: '',
        icon: 'Package'
    });

    React.useEffect(() => {
        if (editingCategory) {
            setNewCategory({
                name: editingCategory.name,
                image: editingCategory.image || '',
                icon: editingCategory.icon || 'Package'
            });
        } else {
            setNewCategory({ name: '', image: '', icon: 'Package' });
        }
    }, [editingCategory]);

    const handleSave = () => {
        if (!newCategory.name) return alert('Please enter a category name');

        const categoryData = {
            id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
            name: newCategory.name,
            image: newCategory.image,
            icon: newCategory.icon
        };

        if (editingCategory) {
            updateCategory(categoryData);
        } else {
            addCategory(categoryData);
        }
        showToast('Successfully saved category!');
        setShowModal(false);
        setEditingCategory(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Category Management</h1>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setNewCategory({ name: '', image: '', icon: 'Package' });
                        setShowModal(true);
                    }}
                    className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover-primary-dark transition-all shrink-0"
                >+ Add Category</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-4 sm:p-5 rounded-[32px] border border-gray-100 shadow-sm group hover:border-primary transition-all relative">
                        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 border relative group-hover:scale-[1.02] transition-transform">
                            {cat.image ? (
                                <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ShoppingBag size={32} />
                                </div>
                            )}
                        </div>
                        <h4 className="font-black text-center text-sm block truncate">{cat.name}</h4>
                        <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all bg-white/80 p-1 rounded-full backdrop-blur">
                            <button
                                onClick={() => { setEditingCategory(cat); setShowModal(true) }}
                                className="p-1.5 text-blue-500 rounded-full hover:bg-blue-50"
                                title="Edit"
                            >
                                <Edit3 size={12} />
                            </button>
                            <button
                                onClick={() => setCategoryToDelete(cat.id)}
                                className="p-1.5 text-red-500 rounded-full hover:bg-red-50"
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={() => deleteCategory(categoryToDelete!)}
                title="Delete Category?"
                message="Deleting this category won't delete its associated products, but they will no longer be filterable under this custom name."
            />

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col p-6 sm:p-8 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-bold tracking-tighter">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-2xl text-gray-400 hover:text-black">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category Name *</label>
                                <input
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold"
                                    placeholder="e.g. Smart Electronics"
                                />
                            </div>
                            <ImageUpload
                                label="Category Banner/Icon Image"
                                value={newCategory.image}
                                onChange={val => setNewCategory({ ...newCategory, image: val })}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-primary text-white w-full py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover-primary-dark transition-all text-sm uppercase tracking-wider"
                        >
                            {editingCategory ? 'Update Category' : 'Save Category'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminProducts = () => {
    const { products, deleteProduct, addProduct, updateProduct, categories } = useAdmin();
    const { showToast } = useCart();
    const [showModal, setShowModal] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [editingProduct, setEditingProduct] = React.useState<any>(null);
    const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
    const [newProduct, setNewProduct] = React.useState({
        name: '',
        shortDescription: '',
        description: '',
        price: '',
        discountPrice: '',
        category: categories[0]?.name || '',
        stock: '',
        images: [] as string[],
        badge: ''
    });

    React.useEffect(() => {
        if (editingProduct) {
            setNewProduct({
                name: editingProduct.name,
                shortDescription: editingProduct.shortDescription || '',
                description: editingProduct.description,
                price: editingProduct.price.toString(),
                discountPrice: editingProduct.discountPrice?.toString() || '',
                category: editingProduct.category,
                stock: editingProduct.stock.toString(),
                images: editingProduct.images || [],
                badge: editingProduct.badge || ''
            });
        } else {
            setNewProduct({ name: '', shortDescription: '', description: '', price: '', discountPrice: '', category: categories[0]?.name || '', stock: '', images: [], badge: '' });
        }
    }, [editingProduct]);

    const handleSave = () => {
        if (!newProduct.name || !newProduct.price || newProduct.images.length === 0) {
            return alert('Please fill in all mandatory product options (Name, Price, Images).');
        }

        const productData = {
            id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
            name: newProduct.name,
            shortDescription: newProduct.shortDescription,
            description: newProduct.description,
            price: Number(newProduct.price),
            discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : undefined,
            category: newProduct.category || categories[0]?.name || '',
            stock: Number(newProduct.stock) || 0,
            images: newProduct.images,
            badge: newProduct.badge,
            rating: editingProduct ? editingProduct.rating : 5,
            reviews: editingProduct ? editingProduct.reviews : []
        };

        if (editingProduct) {
            updateProduct(productData);
        } else {
            addProduct(productData);
        }
        showToast('Successfully saved product!');
        setShowModal(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Products Management</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-xl outline-none focus:border-primary w-full md:w-64 text-sm transition-all bg-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setNewProduct({ name: '', shortDescription: '', description: '', price: '', discountPrice: '', category: categories[0]?.name || '', stock: '', images: [], badge: '' });
                            setShowModal(true);
                        }}
                        className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover-primary-dark transition-all shrink-0"
                    >+ Add Product</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                    <div
                        key={p.id}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-4 hover:border-primary transition-all group relative"
                    >
                        <div className="w-20 h-20 shrink-0 bg-gray-50 rounded-2xl overflow-hidden border">
                            <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-all" alt="" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold truncate text-sm mb-1 text-gray-800">{p.name}</h4>
                                <p className="text-xs text-primary font-black">৳{p.discountPrice || p.price}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${p.stock < 10 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                                    STOCK: {p.stock}
                                </span>
                                <div className="ml-auto flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all bg-white/90 p-1 rounded-full border border-gray-100 shadow-sm">
                                    <button
                                        onClick={() => { setEditingProduct(p); setShowModal(true) }}
                                        className="p-1 px-2 text-blue-500 rounded-lg hover:bg-blue-50 text-[10px] font-bold flex items-center gap-1"
                                    >
                                        <Edit3 size={11} /> Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setProductToDelete(p.id) }}
                                        className="p-1 px-2 text-red-500 rounded-lg hover:bg-red-50 text-[10px] font-bold flex items-center gap-1"
                                    >
                                        <Trash2 size={11} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={() => deleteProduct(productToDelete!)}
                title="Delete Product?"
                message="Are you sure you want to delete this product? This action is permanent."
            />

            {/* Product Edit/Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 sm:p-8 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold tracking-tighter">{editingProduct ? 'Edit Product Option' : 'Add New Product'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-2xl text-gray-400 hover:text-black">&times;</button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white no-scrollbar flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Name *</label>
                                    <input
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold"
                                        placeholder="e.g. Premium Cotton Polo Shirt"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Short Summary Description *</label>
                                    <input
                                        value={newProduct.shortDescription}
                                        onChange={e => setNewProduct({ ...newProduct, shortDescription: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold"
                                        placeholder="e.g. Elegant comfortable fit regular polo cotton"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Long Details *</label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all h-32 resize-none text-sm leading-relaxed"
                                        placeholder="Describe full benefits, materials, sizing parameters..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Main Price (৳) *</label>
                                    <input
                                        type="number"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all text-sm font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Offer Discount Price (Optional)</label>
                                    <input
                                        type="number"
                                        value={newProduct.discountPrice}
                                        onChange={e => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all text-sm font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Category *</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all text-sm font-black text-gray-600 bg-white"
                                    >
                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Level quantity *</label>
                                    <input
                                        type="number"
                                        value={newProduct.stock}
                                        onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Status Badge</label>
                                    <div className="flex gap-2 flex-wrap pb-2">
                                        {['New', 'Hot', 'Top', 'Sale'].map(b => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => setNewProduct({ ...newProduct, badge: b })}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${newProduct.badge === b ? 'border-primary bg-primary text-white' : 'border-gray-100 hover:border-gray-200'}`}
                                            >{b}</button>
                                        ))}
                                        <input
                                            value={['New', 'Hot', 'Top', 'Sale'].includes(newProduct.badge || '') ? '' : newProduct.badge}
                                            onChange={e => setNewProduct({ ...newProduct, badge: e.target.value })}
                                            className="flex-1 min-w-[120px] bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none transition-all text-xs font-bold"
                                            placeholder="Custom Badge text..."
                                        />
                                        {newProduct.badge && (
                                            <button
                                                type="button"
                                                onClick={() => setNewProduct({ ...newProduct, badge: '' })}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <MultiImageUpload
                                        label="Product Showcase Images (Minimum 1 Required) *"
                                        values={newProduct.images}
                                        onChange={vals => setNewProduct({ ...newProduct, images: vals })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex gap-2">
                            <button
                                onClick={handleSave}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover-primary-dark transition-all shadow-xl shadow-red-200"
                            >
                                {editingProduct ? 'Update Product' : 'Save Product Options'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminSettings = () => {
    const { settings, updateSettings } = useAdmin();
    const { showToast } = useCart();
    const [activeTab, setActiveTab] = React.useState<'general' | 'payments' | 'shipping' | 'branding'>('general');
    const [localSettings, setLocalSettings] = React.useState({
        ...settings,
        contactPhone: settings.contactPhone || '',
        email: settings.email || '',
        address: settings.address || '',
        logo: settings.logo || '',
        shippingCharges: {
            insideDhaka: settings.shippingCharges?.insideDhaka || 0,
            outsideDhaka: settings.shippingCharges?.outsideDhaka || 0
        },
        paymentGateways: {
            cod: { enabled: !!settings.paymentGateways?.cod?.enabled },
            bkash: {
                enabled: !!settings.paymentGateways?.bkash?.enabled,
                number: settings.paymentGateways?.bkash?.number || '',
                type: settings.paymentGateways?.bkash?.type || 'Personal',
                instructions: settings.paymentGateways?.bkash?.instructions || ''
            },
            nagad: {
                enabled: !!settings.paymentGateways?.nagad?.enabled,
                number: settings.paymentGateways?.nagad?.number || '',
                type: settings.paymentGateways?.nagad?.type || 'Personal',
                instructions: settings.paymentGateways?.nagad?.instructions || ''
            },
            rocket: {
                enabled: !!settings.paymentGateways?.rocket?.enabled,
                number: settings.paymentGateways?.rocket?.number || '',
                type: settings.paymentGateways?.rocket?.type || 'Personal',
                instructions: settings.paymentGateways?.rocket?.instructions || ''
            },
            bank: {
                enabled: !!settings.paymentGateways?.bank?.enabled,
                bankName: settings.paymentGateways?.bank?.bankName || '',
                branchName: settings.paymentGateways?.bank?.branchName || '',
                accountName: settings.paymentGateways?.bank?.accountName || '',
                accountNumber: settings.paymentGateways?.bank?.accountNumber || '',
                instructions: settings.paymentGateways?.bank?.instructions || ''
            }
        }
    });

    const handleSave = () => {
        updateSettings(localSettings as any);
        showToast('Settings saved successfully!');
    };

    const TabButton = ({ id, label }: { id: any, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-3 md:px-5 py-2 rounded-xl font-bold text-xs md:text-sm transition-all shrink-0 cursor-pointer ${activeTab === id ? 'bg-primary text-white shadow-lg shadow-red-100 font-extrabold' : 'text-gray-400 hover:bg-gray-50'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900">General Settings</h1>
                    <p className="text-xs text-gray-400 font-bold">Configure branding, delivery fees, and gateway integrations</p>
                </div>
                {/* Responsive Tab Grid for small screen wrap */}
                <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border shadow-sm gap-1 sm:gap-2 justify-start sm:justify-center">
                    <TabButton id="general" label="Basic Info" />
                    <TabButton id="branding" label="Branding" />
                    <TabButton id="shipping" label="Shipping Fee" />
                    <TabButton id="payments" label="Gateways" />
                </div>
            </div>

            <div className="animate-in fade-in duration-300">
                {activeTab === 'general' && (
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                <Phone size={20} />
                            </div>
                            <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Contact Information</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Hotline Number</label>
                                <input
                                    value={localSettings.contactPhone}
                                    onChange={e => setLocalSettings({ ...localSettings, contactPhone: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Hotline Hours</label>
                                <input
                                    value={localSettings.hotlineHours || ''}
                                    onChange={e => setLocalSettings({ ...localSettings, hotlineHours: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                    placeholder="10:00 AM to 8:00 PM"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">WhatsApp Number</label>
                                <input
                                    value={localSettings.whatsappNumber || ''}
                                    onChange={e => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Support Email</label>
                                <input
                                    value={localSettings.email}
                                    type="email"
                                    onChange={e => setLocalSettings({ ...localSettings, email: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                    placeholder="support@example.com"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Physical Address / Headquarters</label>
                                <textarea
                                    value={localSettings.address}
                                    onChange={e => setLocalSettings({ ...localSettings, address: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg h-24 resize-none"
                                    placeholder="House 123, Road 4, Uttara, Dhaka-1230"
                                />
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save General Settings</button>
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl">
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
                )}

                {activeTab === 'shipping' && (
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 max-w-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Delivery and Shipping Charges</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Inside Dhaka Fee (৳)</label>
                                <input
                                    value={localSettings.shippingCharges.insideDhaka}
                                    type="number"
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        shippingCharges: {
                                            ...localSettings.shippingCharges,
                                            insideDhaka: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-bold">Outside Dhaka Fee (৳)</label>
                                <input
                                    value={localSettings.shippingCharges.outsideDhaka}
                                    type="number"
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        shippingCharges: {
                                            ...localSettings.shippingCharges,
                                            outsideDhaka: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 focus:border-primary transition-all font-bold text-lg font-mono"
                                />
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition-all shadow-md">Save Shipping Fees</button>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-8 max-w-2xl">
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
                            const gw = localSettings.paymentGateways[gateway as 'bkash' | 'nagad' | 'rocket'];
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
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Name Holder</label>
                                        <input
                                            value={localSettings.paymentGateways.bank.accountName}
                                            onChange={e => setLocalSettings({
                                                ...localSettings,
                                                paymentGateways: {
                                                    ...localSettings.paymentGateways,
                                                    bank: { ...localSettings.paymentGateways.bank, accountName: e.target.value }
                                                }
                                            })}
                                            className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Wire Account Number</label>
                                        <input
                                            value={localSettings.paymentGateways.bank.accountNumber}
                                            onChange={e => setLocalSettings({
                                                ...localSettings,
                                                paymentGateways: {
                                                    ...localSettings.paymentGateways,
                                                    bank: { ...localSettings.paymentGateways.bank, accountNumber: e.target.value }
                                                }
                                            })}
                                            className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-sm font-bold font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instructions</label>
                                        <input
                                            value={localSettings.paymentGateways.bank.instructions}
                                            onChange={e => setLocalSettings({
                                                ...localSettings,
                                                paymentGateways: {
                                                    ...localSettings.paymentGateways,
                                                    bank: { ...localSettings.paymentGateways.bank, instructions: e.target.value }
                                                }
                                            })}
                                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none text-sm"
                                            placeholder="e.g. Include transaction deposit slip copy at checkout point."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={handleSave} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg">Save Payment Settings</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminStaff = () => {
    const { staff, addStaff, removeStaff } = useAdmin();
    const { showToast } = useCart();
    const [activeTab, setActiveTab] = React.useState<'staff' | 'users'>('staff');
    const [showModal, setShowModal] = React.useState(false);
    const [staffToDelete, setStaffToDelete] = React.useState<string | null>(null);
    const [newStaff, setNewStaff] = React.useState({
        name: '',
        role: 'Editor' as 'Admin' | 'Editor' | 'Order Manager',
        phone: ''
    });

    const [users, setUsers] = React.useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = React.useState(false);

    React.useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth.php`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUserRole = async (user: any) => {
        const newRole = user.role === 'Admin' ? 'User' : 'Admin';
        if (!confirm(`Are you sure you want to make ${user.name} an ${newRole}?`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_role', id: user.id, role: newRole })
            });
            if (res.ok) {
                showToast(`Successfully updated ${user.name} to ${newRole}`);
                setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
            } else {
                alert('Failed to update role');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = () => {
        if (!newStaff.name) return;
        addStaff({
            id: `staff-${Date.now()}`,
            ...newStaff
        });
        showToast('Successfully added new staff member!');
        setShowModal(false);
        setNewStaff({ name: '', role: 'Editor', phone: '' });
    };

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Staff & Users</h1>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'staff' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Staff Directory
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        All Users
                    </button>
                </div>
            </div>

            {activeTab === 'staff' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-200"
                        >+ Add New Staff</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {staff.map(s => (
                            <div key={s.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:border-primary transition-all relative">
                                <button
                                    onClick={() => setStaffToDelete(s.id)}
                                    className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove Staff"
                                >
                                    <X size={16} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg uppercase">
                                        {s.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{s.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{s.role}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-50 space-y-2">
                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-2"><Phone size={14} /> {s.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {loadingUsers ? (
                        <div className="p-8 text-center text-gray-500 font-bold">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Phone</th>
                                        <th className="px-6 py-4">Address</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">{u.phone}</td>
                                            <td className="px-6 py-4 text-gray-500">{u.address || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'Admin' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>
                                                    {u.role || 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleUserRole(u)}
                                                    className="text-primary hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    {u.role === 'Admin' ? 'Revoke Admin' : 'Make Admin'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in fade-in duration-200 animate-out shrink-0">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase mb-2">New Staff Member</h2>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name *</label>
                                <input value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full bg-gray-50 border px-4 py-2.5 rounded-xl outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-black text-gray-600">Dashboard Access Role *</label>
                                <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value as any })} className="w-full bg-gray-50 border px-4 py-3 rounded-xl outline-none bg-white">
                                    <option value="Admin">Admin</option>
                                    <option value="Editor">Editor</option>
                                    <option value="Order Manager">Order Manager</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                                <input value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} className="w-full bg-gray-50 border px-4 py-2.5 rounded-xl outline-none" placeholder="01XXXXXXXXX" />
                            </div>
                        </div>
                        <button onClick={handleAdd} className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-red-200 mt-2 uppercase tracking-wide">Add Staff</button>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!staffToDelete}
                onClose={() => setStaffToDelete(null)}
                onConfirm={() => removeStaff(staffToDelete!)}
                title="Remove Staff?"
                message="Are you sure you want to remove this staff member? They will instantly lose access to the administrative dashboard."
            />
        </div>
    );
};

export const AdminBanners = () => {
    const { banners, addBanner, updateBanner, deleteBanner } = useAdmin();
    const { toast } = useCart();
    const [showModal, setShowModal] = React.useState(false);
    const [editingBanner, setEditingBanner] = React.useState<any>(null);
    const [bannerToDelete, setBannerToDelete] = React.useState<string | null>(null);
    const [newBanner, setNewBanner] = React.useState({
        title: '',
        link: '',
        image: '',
        showButton: false,
        buttonText: 'Shop Now',
        buttonLink: '',
        buttonTextColor: '#FFFFFF',
        buttonBgColor: '#EF4444',
        titleColor: '#FFFFFF'
    });

    React.useEffect(() => {
        if (editingBanner) {
            setNewBanner({
                title: editingBanner.title || '',
                link: editingBanner.link || '',
                image: editingBanner.image || '',
                showButton: !!editingBanner.showButton,
                buttonText: editingBanner.buttonText || 'Shop Now',
                buttonLink: editingBanner.buttonLink || '',
                buttonTextColor: editingBanner.buttonTextColor || '#FFFFFF',
                buttonBgColor: editingBanner.buttonBgColor || '#EF4444',
                titleColor: editingBanner.titleColor || '#FFFFFF'
            });
        } else {
            setNewBanner({ title: '', link: '', image: '', showButton: false, buttonText: 'Shop Now', buttonLink: '', buttonTextColor: '#FFFFFF', buttonBgColor: '#EF4444', titleColor: '#FFFFFF' });
        }
    }, [editingBanner]);

    const handleSave = () => {
        if (!newBanner.image) return alert('Banner image is required');

        const bannerData = {
            id: editingBanner ? editingBanner.id : `b-${Date.now()}`,
            ...newBanner
        };

        if (editingBanner) {
            updateBanner(bannerData);
        } else {
            addBanner(bannerData);
        }
        setShowModal(false);
        setEditingBanner(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Banners Management</h1>
                <button
                    onClick={() => {
                        setEditingBanner(null);
                        setNewBanner({ title: '', link: '', image: '', showButton: false, buttonText: 'Shop Now', buttonLink: '', buttonTextColor: '#FFFFFF', buttonBgColor: '#EF4444', titleColor: '#FFFFFF' });
                        setShowModal(true);
                    }}
                    className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover-primary-dark transition-all shrink-0"
                >+ Add Banner</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {banners.map(b => (
                    <div key={b.id} className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm group hover:border-primary transition-all relative">
                        <div className="aspect-[21/9] bg-gray-50 rounded-2xl overflow-hidden mb-4 border relative group-hover:scale-[1.02] transition-transform">
                            {b.image ? (
                                <img src={b.image} className="w-full h-full object-cover" alt="Banner" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <MonitorPlay size={32} />
                                </div>
                            )}
                        </div>
                        <div className="px-2 pb-2">
                            <h4 className="font-black text-sm block truncate text-gray-900">{b.title || 'Untitled Banner'}</h4>
                            <p className="text-xs text-blue-500 font-bold truncate mt-1">{b.link || 'No Link Provided'}</p>
                        </div>
                        <div className="absolute top-6 right-6 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all bg-white/80 p-1 rounded-full backdrop-blur">
                            <button
                                onClick={() => { setEditingBanner(b); setShowModal(true) }}
                                className="p-1.5 text-blue-500 rounded-full hover:bg-blue-50"
                                title="Edit"
                            >
                                <Edit3 size={14} />
                            </button>
                            <button
                                onClick={() => setBannerToDelete(b.id)}
                                className="p-1.5 text-red-500 rounded-full hover:bg-red-50"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!bannerToDelete}
                onClose={() => setBannerToDelete(null)}
                onConfirm={() => deleteBanner(bannerToDelete!)}
                title="Delete Banner?"
                message="Are you sure you want to remove this banner from the home screen?"
            />

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b p-6 sm:p-8 pb-4 shrink-0">
                            <h2 className="text-xl font-bold tracking-tighter">{editingBanner ? 'Edit Banner' : 'New Banner'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-2xl text-gray-400 hover:text-black">&times;</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Banner Title (Optional)</label>
                                <input
                                    value={newBanner.title}
                                    onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold"
                                    placeholder="e.g. Summer Sale 2026"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={newBanner.titleColor}
                                        onChange={e => setNewBanner({ ...newBanner, titleColor: e.target.value })}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={newBanner.titleColor}
                                        onChange={e => setNewBanner({ ...newBanner, titleColor: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-3 py-2 rounded-xl outline-none transition-all text-sm font-bold font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Redirect Link (Optional)</label>
                                <input
                                    value={newBanner.link}
                                    onChange={e => setNewBanner({ ...newBanner, link: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold"
                                    placeholder="e.g. /products?category=Fashion"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Main Banner Image *</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative group w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all">
                                        {newBanner.image ? (
                                            <>
                                                <img src={newBanner.image} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Edit3 className="text-white" size={20} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 group-hover:text-primary">
                                                <Upload size={24} />
                                                <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Upload Banner</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setNewBanner({ ...newBanner, image: reader.result as string });
                                                    reader.readAsDataURL(file);
                                                }
                                                e.target.value = '';
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    {newBanner.image && (
                                        <button
                                            type="button"
                                            onClick={() => setNewBanner({ ...newBanner, image: '' })}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Custom Button Settings */}
                            <div className="pt-4 border-t space-y-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={newBanner.showButton}
                                        onChange={e => setNewBanner({ ...newBanner, showButton: e.target.checked })}
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                    />
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-black">Show Custom Button on Banner</span>
                                </label>

                                {newBanner.showButton && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Button Text</label>
                                            <input
                                                value={newBanner.buttonText}
                                                onChange={e => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-3 py-2 rounded-xl outline-none transition-all text-sm font-bold"
                                                placeholder="e.g. Shop Now"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Button Link</label>
                                            <input
                                                value={newBanner.buttonLink || ''}
                                                onChange={e => setNewBanner({ ...newBanner, buttonLink: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-3 py-2 rounded-xl outline-none transition-all text-sm font-bold"
                                                placeholder="e.g. /products"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Text Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={newBanner.buttonTextColor}
                                                    onChange={e => setNewBanner({ ...newBanner, buttonTextColor: e.target.value })}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={newBanner.buttonTextColor}
                                                    onChange={e => setNewBanner({ ...newBanner, buttonTextColor: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-3 py-2 rounded-xl outline-none transition-all text-sm font-bold font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bg Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={newBanner.buttonBgColor}
                                                    onChange={e => setNewBanner({ ...newBanner, buttonBgColor: e.target.value })}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={newBanner.buttonBgColor}
                                                    onChange={e => setNewBanner({ ...newBanner, buttonBgColor: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-3 py-2 rounded-xl outline-none transition-all text-sm font-bold font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 pt-4 border-t shrink-0">
                            <button
                                onClick={handleSave}
                                className="bg-primary text-white w-full py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover-primary-dark transition-all text-sm uppercase tracking-wider"
                            >
                                {editingBanner ? 'Update Banner' : 'Save Banner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminContacts = () => {
    const [messages, setMessages] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/contacts.php`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await fetch(`${API_BASE_URL}/contacts.php?id=${id}`, { method: 'DELETE' });
            setMessages(messages.filter(m => m.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 pb-32">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Contact Messages</h1>

            {loading ? (
                <div className="text-center py-10 font-bold text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
                <div className="text-center py-10 font-bold text-gray-400">No contact messages received yet.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{msg.subject}</h3>
                                    <div className="text-sm text-gray-500 font-medium mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                        <span className="flex items-center gap-1"><User size={14} /> {msg.name}</span>
                                        <span className="flex items-center gap-1"><Phone size={14} /> {msg.phone}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(msg.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(msg.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap font-medium">
                                {msg.message}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
