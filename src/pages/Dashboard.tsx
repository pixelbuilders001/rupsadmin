import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    ShoppingBag,
    Tag,
    Users as UsersIcon,
    Package,
    MessageSquare,
    MapPin,
    RefreshCw,
    Star,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        users: 0,
        orders: 0,
        reviews: 0,
        returns: 0,
        pincodes: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [recentReturns, setRecentReturns] = useState<any[]>([]);
    const [recentPincodes, setRecentPincodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'reviews' | 'returns' | 'pincodes'>('orders');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: productCount },
                { count: categoryCount },
                { count: userCount },
                { count: orderCount, data: orders },
                { count: reviewCount, data: reviewsData },
                { count: returnCount, data: returnsData },
                { count: pincodeCount, data: pincodesData }
            ] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
                supabase.from('product_reviews').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
                supabase.from('returns').select('*', { count: 'exact' }).order('requested_at', { ascending: false }).limit(5),
                supabase.from('serviceable_pincodes').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(5)
            ]);

            setStats({
                products: productCount || 0,
                categories: categoryCount || 0,
                users: userCount || 0,
                orders: orderCount || 0,
                reviews: reviewCount || 0,
                returns: returnCount || 0,
                pincodes: pincodeCount || 0
            });

            setRecentOrders(orders || []);
            setRecentReviews(reviewsData || []);
            setRecentReturns(returnsData || []);
            setRecentPincodes(pincodesData || []);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, color }: any) => {
        const colorClasses: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            indigo: 'bg-indigo-50 text-indigo-600',
            purple: 'bg-purple-50 text-purple-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            orange: 'bg-orange-50 text-orange-600',
            red: 'bg-red-50 text-red-600',
            cyan: 'bg-cyan-50 text-cyan-600',
        };

        return (
            <div className="card p-6 flex items-center">
                <div className={`p-4 rounded-lg mr-4 ${colorClasses[color] || 'bg-gray-50 text-gray-600'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-admin-text-secondary uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-admin-primary">{value}</p>
                </div>
            </div>
        );
    };

    const getReturnStatusInfo = (status: string) => {
        const colors: Record<string, string> = {
            requested: 'bg-yellow-100 text-yellow-800',
            return_approved: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            return_rejected: 'bg-red-100 text-red-800',
        };
        const icons: Record<string, any> = {
            requested: Clock,
            return_approved: Truck,
            completed: CheckCircle,
            return_rejected: XCircle,
        };
        return {
            color: colors[status] || 'bg-gray-100 text-gray-800',
            Icon: icons[status] || Clock
        };
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-admin-primary">Store Overview</h1>
                <p className="text-admin-text-secondary mt-1">Quick summary of your business performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Package} label="Products" value={stats.products} color="blue" />
                <StatCard icon={Tag} label="Categories" value={stats.categories} color="indigo" />
                <StatCard icon={UsersIcon} label="Users" value={stats.users} color="purple" />
                <StatCard icon={ShoppingBag} label="Orders" value={stats.orders} color="emerald" />
                <StatCard icon={MessageSquare} label="Reviews" value={stats.reviews} color="orange" />
                <StatCard icon={RefreshCw} label="Returns" value={stats.returns} color="red" />
                <StatCard icon={MapPin} label="Serviceable" value={stats.pincodes} color="cyan" />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
                    <div className="flex space-x-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`pb-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'orders' ? 'border-admin-accent text-admin-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Recent Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`pb-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-admin-accent text-admin-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Recent Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab('returns')}
                            className={`pb-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'returns' ? 'border-admin-accent text-admin-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Recent Returns
                        </button>
                        <button
                            onClick={() => setActiveTab('pincodes')}
                            className={`pb-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'pincodes' ? 'border-admin-accent text-admin-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Serviceable Areas
                        </button>
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        {activeTab === 'orders' && (
                            <table className="min-w-full divide-y divide-gray-200 text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentOrders.length > 0 ? recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                #{order.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-admin-primary">
                                                {order.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-primary font-semibold">
                                                ₹{order.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                            ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'}`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                                No recent orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'reviews' && (
                            <table className="min-w-full divide-y divide-gray-200 text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Review</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Engagement</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentReviews.length > 0 ? recentReviews.map((review) => (
                                        <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-yellow-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            fill={i < review.rating ? "currentColor" : "none"}
                                                            className={i < review.rating ? "" : "text-gray-300"}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-admin-primary font-medium line-clamp-1">{review.title || 'Untitled'}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{review.review || 'No content'}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-4">
                                                    <div className="flex items-center text-green-600" title="Likes">
                                                        <ThumbsUp size={14} className="mr-1" />
                                                        <span className="text-xs font-medium">{review.likes || 0}</span>
                                                    </div>
                                                    <div className="flex items-center text-red-600" title="Dislikes">
                                                        <ThumbsDown size={14} className="mr-1" />
                                                        <span className="text-xs font-medium">{review.dislikes || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                            ${review.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}
                                                >
                                                    {review.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(review.created_at), 'MMM dd, yyyy')}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                                No recent reviews found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'returns' && (
                            <table className="min-w-full divide-y divide-gray-200 text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Return ID</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentReturns.length > 0 ? recentReturns.map((item) => {
                                        const { color, Icon } = getReturnStatusInfo(item.status);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                    #{item.id.slice(0, 8)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-admin-primary capitalize">{item.reason_type?.replace(/_/g, ' ')}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${color}`}>
                                                        <Icon size={12} className="mr-1" />
                                                        {item.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(item.requested_at), 'MMM dd, yyyy')}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                                No recent returns found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'pincodes' && (
                            <table className="min-w-full divide-y divide-gray-200 text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentPincodes.length > 0 ? recentPincodes.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-admin-primary">
                                                {item.pincode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {item.city}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {item.state}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                            ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                                No serviceable pincodes found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
