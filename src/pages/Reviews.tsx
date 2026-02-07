import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Star, Search, Filter, MessageSquare, Package, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const Reviews = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            // 1. Fetch reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('product_reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;

            if (!reviewsData || reviewsData.length === 0) {
                setReviews([]);
                return;
            }

            // 2. Collect IDs for enrichment
            const productIds = Array.from(new Set(reviewsData.map(r => r.product_id)));
            const userIds = Array.from(new Set(reviewsData.map(r => r.user_id)));

            // 3. Fetch products and profiles in parallel
            const [productsRes, profilesRes] = await Promise.all([
                supabase.from('products').select('id, name, thumbnail_url').in('id', productIds),
                supabase.from('profiles').select('id, full_name, email').in('id', userIds)
            ]);

            // 4. Map data back to reviews
            const enrichedReviews = reviewsData.map(review => ({
                ...review,
                products: productsRes.data?.find(p => p.id === review.product_id),
                profiles: profilesRes.data?.find(p => p.id === review.user_id)
            }));

            setReviews(enrichedReviews);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch reviews');
            console.error('Reviews Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('product_reviews')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', reviewId);

            if (error) throw error;

            toast.success(`Review ${newStatus} successfully`);
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
        } catch (error: any) {
            toast.error(error.message || 'Error updating review status');
        }
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch =
            r.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.review?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.title?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Product Reviews</h1>
                    <p className="text-admin-text-secondary mt-1">Manage and moderate customer reviews for your products.</p>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by product, user, or review content..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="input py-2"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Review</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Engagement</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="flex items-center"><div className="w-10 h-10 bg-gray-200 rounded mr-3"></div><div className="h-4 w-24 bg-gray-100 rounded"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-gray-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredReviews.length > 0 ? (
                                filteredReviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 border border-gray-100 overflow-hidden">
                                                    {review.products?.thumbnail_url ? (
                                                        <img src={review.products.thumbnail_url} alt={review.products.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-admin-primary truncate max-w-[150px]" title={review.products?.name}>
                                                        {review.products?.name || 'Unknown Product'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm text-admin-primary font-medium">{review.profiles?.full_name || 'Anonymous'}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">{review.profiles?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs md:max-w-md lg:max-w-lg">
                                                {review.title && <div className="text-sm font-bold text-gray-900 mb-0.5">{review.title}</div>}
                                                <div className="text-sm text-gray-600 line-clamp-2" title={review.review}>
                                                    {review.review || <span className="italic text-gray-400">No comment</span>}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    {format(new Date(review.created_at), 'MMM dd, yyyy HH:mm')}
                                                </div>
                                            </div>
                                        </td>
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
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(review.status)}`}>
                                                {review.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end space-x-2">
                                                {review.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                        title="Approve Review"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                )}
                                                {review.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Reject Review"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <MessageSquare size={48} className="text-gray-200 mb-2" />
                                            <p className="italic">No reviews found.</p>
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
