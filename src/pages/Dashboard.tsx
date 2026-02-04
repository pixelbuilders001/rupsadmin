import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Tag, Users as UsersIcon, Package, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        users: 0,
        orders: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: productCount },
                { count: categoryCount },
                { count: userCount },
                { data: orders }
            ] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
            ]);

            setStats({
                products: productCount || 0,
                categories: categoryCount || 0,
                users: userCount || 0,
                orders: 0 // We'll fetch actual order count if needed, but for now 0
            });
            setRecentOrders(orders || []);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <div className="card p-6 flex items-center">
            <div className={`p-4 rounded-lg bg-${color}-50 text-${color}-600 mr-4`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-medium text-admin-text-secondary uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-admin-primary">{value}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>)}
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
                <StatCard icon={Package} label="Total Products" value={stats.products} color="blue" />
                <StatCard icon={Tag} label="Categories" value={stats.categories} color="indigo" />
                <StatCard icon={UsersIcon} label="Total Users" value={stats.users} color="purple" />
                <StatCard icon={ShoppingBag} label="Recent Orders" value={recentOrders.length} color="emerald" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-admin-primary">Recent Orders</h2>
                    <button className="text-admin-accent hover:underline text-sm font-medium">View all</button>
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
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
                    </div>
                </div>
            </div>
        </div>
    );
};
