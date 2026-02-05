import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, Phone, Calendar, UserCheck, UserX, Eye, Package, Heart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Modal } from '../components/ui/Modal';

export const Users = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [userWishlist, setUserWishlist] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setActiveTab('profile');
        fetchUserDetails(user.id);
    };

    const fetchUserDetails = async (userId: string) => {
        try {
            setLoadingDetails(true);

            // Fetch Orders
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;
            setUserOrders(orders || []);

            // Fetch Wishlist
            const { data: wishlist, error: wishlistError } = await supabase
                .from('wishlists')
                .select('*, products:product_id(*)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (wishlistError) throw wishlistError;
            setUserWishlist(wishlist || []);

        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch user details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleToggleRole = async (userId: string, isAdmin: boolean) => {
        try {
            setLoadingDetails(true);
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: isAdmin })
                .eq('id', userId);

            if (error) throw error;

            toast.success(`User role updated to ${isAdmin ? 'Admin' : 'Customer'}`);

            // Update local users state
            setUsers(prevUsers => prevUsers.map(u =>
                u.id === userId ? { ...u, is_admin: isAdmin } : u
            ));

            // Update selected user state if it matches the current user
            if (selectedUser?.id === userId) {
                setSelectedUser((prev: any) => ({ ...prev, is_admin: isAdmin }));
            }

        } catch (error: any) {
            toast.error(error.message || 'Failed to update user role');
        } finally {
            setLoadingDetails(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Users</h1>
                    <p className="text-admin-text-secondary mt-1">View your customer base and their profile details.</p>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="flex items-center"><div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div><div className="h-4 w-32 bg-gray-100 rounded"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-admin-accent/10 flex items-center justify-center text-admin-accent overflow-hidden font-bold border border-admin-accent/20">
                                                    {(user.avatar_url || user.profile_image) ? (
                                                        <img src={user.avatar_url || user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-semibold text-admin-primary">{user.full_name || 'Anonymous User'}</div>
                                                    <div className="text-xs text-gray-500 font-mono">ID: {user.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail size={14} className="mr-1.5 opacity-60" />
                                                    {user.email}
                                                </div>
                                                {user.phone_number && (
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Phone size={14} className="mr-1.5 opacity-60" />
                                                        {user.phone_number}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_verified ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <UserCheck size={12} className="mr-1" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <UserX size={12} className="mr-1" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-1.5 opacity-60" />
                                                {format(new Date(user.created_at), 'MMM dd, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_admin ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold tracking-tight">ADMIN</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">CUSTOMER</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end space-x-2">
                                                <select
                                                    value={user.is_admin ? 'admin' : 'customer'}
                                                    onChange={(e) => handleToggleRole(user.id, e.target.value === 'admin')}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm cursor-pointer outline-none transition-colors ${user.is_admin
                                                        ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                                                        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    <option value="customer">CUSTOMER</option>
                                                    <option value="admin">ADMIN</option>
                                                </select>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUserClick(user);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="User Details"
                maxWidth="3xl"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-admin-accent/10 flex items-center justify-center text-admin-accent overflow-hidden font-bold text-xl border-2 border-admin-accent/20">
                                {(selectedUser.avatar_url || selectedUser.profile_image) ? (
                                    <img src={selectedUser.avatar_url || selectedUser.profile_image} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-admin-primary">{selectedUser.full_name || 'Anonymous User'}</h2>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            {[
                                { id: 'profile', label: 'Profile', icon: Eye },
                                { id: 'orders', label: 'Orders', icon: Package },
                                { id: 'wishlist', label: 'Wishlist', icon: Heart },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-admin-accent text-admin-accent'
                                        : 'border-transparent text-gray-500 hover:text-admin-primary'
                                        }`}
                                >
                                    <tab.icon size={16} className="mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                            {loadingDetails ? (
                                <div className="flex items-center justify-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'profile' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                                                    <p className="text-sm font-medium text-admin-primary">{selectedUser.full_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                                    <p className="text-sm font-medium text-admin-primary">{selectedUser.email}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                                                    <p className="text-sm font-medium text-admin-primary">{selectedUser.phone_number || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Joined On</label>
                                                    <p className="text-sm font-medium text-admin-primary">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Authentication Provider</label>
                                                    <p className="text-sm font-medium text-admin-primary uppercase">{selectedUser.provider || 'Email'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                                    <div className="flex items-center mt-1">
                                                        {selectedUser.is_verified ? (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">Verified</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending Verification</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'orders' && (
                                        <div className="py-4 space-y-4">
                                            {userOrders.length > 0 ? (
                                                userOrders.map((order) => (
                                                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div>
                                                            <p className="text-sm font-bold text-admin-primary">Order #{order.order_code || order.id.slice(0, 8)}</p>
                                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                                                <Calendar size={12} className="mr-1" />
                                                                {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                                                <span className="mx-2">•</span>
                                                                <Clock size={12} className="mr-1" />
                                                                {order.status.toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-admin-primary">₹{order.amount}</p>
                                                            <p className="text-[10px] text-gray-500">{order.payment_method}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-gray-400">
                                                    <Package size={48} className="mx-auto mb-2 opacity-20" />
                                                    <p>No orders found for this user.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'wishlist' && (
                                        <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {userWishlist.length > 0 ? (
                                                userWishlist.map((item) => (
                                                    <div key={item.id} className="flex items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                        <div className="w-12 h-12 rounded bg-gray-100 mr-3 overflow-hidden border border-gray-100 flex-shrink-0">
                                                            {item.products?.thumbnail_url ? (
                                                                <img src={item.products.thumbnail_url} alt={item.products.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <Heart size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-admin-primary truncate">{item.products?.name}</p>
                                                            <p className="text-xs font-bold text-admin-accent">₹{item.products?.price}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center py-12 text-gray-400">
                                                    <Heart size={48} className="mx-auto mb-2 opacity-20" />
                                                    <p>No items in wishlist.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
