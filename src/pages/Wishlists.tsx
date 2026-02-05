import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Heart, User, Package, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const Wishlists = () => {
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWishlistItems();
    }, []);

    const fetchWishlistItems = async () => {
        try {
            setLoading(true);
            // We join with profiles (via user_id) and products (via product_id)
            const { data, error } = await supabase
                .from('wishlists')
                .select(`
                    id,
                    created_at,
                    user_id,
                    product_id,
                    profiles:user_id (id, full_name, email, phone_number, avatar_url, profile_image),
                    products:product_id (id, name, thumbnail_url, price)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWishlistItems(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch wishlist items');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this item from the wishlist?')) return;

        try {
            const { error } = await supabase
                .from('wishlists')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Wishlist item removed');
            fetchWishlistItems();
        } catch (error: any) {
            toast.error(error.message || 'Error removing item');
        }
    };

    const filteredItems = wishlistItems.filter(item =>
        item.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Wishlists</h1>
                    <p className="text-admin-text-secondary mt-1">Track products that customers are interested in.</p>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by user or product..."
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
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added At</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-admin-accent/10 flex items-center justify-center text-admin-accent mr-3 overflow-hidden border border-admin-accent/20">
                                                    {(item.profiles?.avatar_url || item.profiles?.profile_image) ? (
                                                        <img
                                                            src={item.profiles.avatar_url || item.profiles.profile_image}
                                                            alt={item.profiles.full_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User size={14} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-admin-primary">
                                                        {item.profiles?.full_name || 'Anonymous'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.profiles?.email}
                                                    </div>
                                                    {item.profiles?.phone_number && (
                                                        <div className="text-[10px] text-gray-400">
                                                            {item.profiles.phone_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded bg-gray-100 mr-3 overflow-hidden border border-gray-100">
                                                    {item.products?.thumbnail_url ? (
                                                        <img src={item.products.thumbnail_url} alt={item.products.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-admin-primary">
                                                        {item.products?.name}
                                                    </div>
                                                    <div className="text-xs text-admin-accent font-bold">
                                                        ₹{item.products?.price}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center text-xs">
                                                <Calendar size={14} className="mr-1.5 opacity-60" />
                                                {format(new Date(item.created_at), 'MMM dd, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-gray-400 hover:text-admin-danger transition-colors"
                                                title="Remove from wishlist"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                        <div className="flex flex-col items-center justify-center">
                                            <Heart size={48} className="text-gray-200 mb-2" />
                                            {searchTerm ? `No wishlist items matching "${searchTerm}"` : 'No wishlist items found.'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
