import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Eye, Filter, CheckCircle, Truck, RefreshCw, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Modal } from '../components/ui/Modal';

const statusColors: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800',
    return_approved: 'bg-blue-100 text-blue-800',
    return_rejected: 'bg-red-100 text-red-800',
    pickup_scheduled: 'bg-indigo-100 text-indigo-800',
    picked_up: 'bg-purple-100 text-purple-800',
    qc_passed: 'bg-green-100 text-green-800',
    qc_failed: 'bg-red-50 text-red-600',
    refund_initiated: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-600 text-white',
};

const statusIcons: Record<string, any> = {
    requested: Clock,
    return_approved: CheckCircle,
    return_rejected: XCircle,
    pickup_scheduled: Truck,
    picked_up: Truck,
    qc_passed: CheckCircle,
    qc_failed: AlertTriangle,
    refund_initiated: RefreshCw,
    completed: CheckCircle,
};

export const Returns = () => {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminRemark, setAdminRemark] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            // Attempt to fetch returns with fallback if relations don't exist yet
            // We'll try to get order details if possible, assuming relationships exist
            const { data, error } = await supabase
                .from('returns')
                .select('*')
                .order('requested_at', { ascending: false });

            if (error) throw error;
            setReturns(data || []);
        } catch (error: any) {
            console.error('Error fetching returns:', error);
            toast.error(error.message || 'Failed to fetch returns');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (returnId: string, newStatus: string) => {
        try {
            setUpdatingStatus(true);

            // Get the current user's session token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                throw new Error('You must be logged in to update return status');
            }

            // 1. Update the return status in the 'returns' table directly
            const { error: updateError } = await supabase
                .from('returns')
                .update({
                    status: newStatus,
                    admin_remark: adminRemark || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', returnId);

            if (updateError) throw updateError;

            // 2. Call the order-status-change edge function to trigger any order-related side effects
            const userToken = session.access_token;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${supabaseUrl}/functions/v1/order-status-change`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: selectedReturn?.order_id,
                    order_item_id: selectedReturn?.order_item_id,
                    status: newStatus,
                    note: adminRemark || `Return status updated to ${newStatus} by admin`
                }),
            });

            if (!response.ok) {

                // We log the error but don't stop the flow since the primary return update succeeded
                console.error('Failed to trigger order status change:', await response.text());
                toast.warning('Return updated, but order status sync may have failed.');
            } else {
                toast.success(`Return request updated to ${newStatus}`);
            }

            setAdminRemark('');
            fetchReturns();
            if (selectedReturn?.id === returnId) {
                setSelectedReturn((prev: any) => ({ ...prev, status: newStatus, admin_remark: adminRemark }));
                setIsModalOpen(false);
            }
        } catch (error: any) {
            console.error('Error updating return status:', error);
            toast.error(error.message || 'Error updating status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleViewDetails = async (returnItem: any) => {
        setSelectedReturn(returnItem);
        setAdminRemark(returnItem.admin_remark || '');
        setIsModalOpen(true);

        try {
            // Fetch order details including items and product info
            const { data: orderData, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(name))')
                .eq('id', returnItem.order_id)
                .single();

            if (error) {
                console.error('Error fetching order details:', error);
                return;
            }

            // Update selected return with order details
            setSelectedReturn((prev: any) => ({
                ...prev,
                orderDetails: orderData
            }));
        } catch (error) {
            console.error('Error in handleViewDetails:', error);
        }
    };

    const filteredReturns = returns.filter(r =>
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.order_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Returns & Exchanges</h1>
                    <p className="text-admin-text-secondary mt-1">Manage return requests and status.</p>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Return ID or Order ID..."
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
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Return ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredReturns.length > 0 ? (
                                filteredReturns.map((item) => {
                                    const Icon = statusIcons[item.status] || Clock;
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                #{item.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-admin-primary">
                                                #{item.order_id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 capitalize">
                                                    {item.reason_type?.replace(/_/g, ' ')}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-[150px]">{item.reason}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    <Icon size={12} className="mr-1" />
                                                    {item.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.requested_at ? format(new Date(item.requested_at), 'MMM dd, yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleViewDetails(item)}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                        No return requests found.
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
                title="Return Request Details"
                maxWidth="3xl"
            >
                {selectedReturn && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Return Info</p>
                                <p className="text-sm"><span className="font-semibold">ID:</span> {selectedReturn.id}</p>
                                <p className="text-sm"><span className="font-semibold">Order ID:</span> {selectedReturn.order_id}</p>
                                <p className="text-sm"><span className="font-semibold">User ID:</span> {selectedReturn.user_id}</p>
                                <p className="text-sm"><span className="font-semibold">Requested:</span> {selectedReturn.requested_at && format(new Date(selectedReturn.requested_at), 'PPP p')}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reason & Description</p>
                                <p className="text-sm font-medium capitalize text-red-600">{selectedReturn.reason_type?.replace(/_/g, ' ')}</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedReturn.reason}</p>
                                {selectedReturn.description && (
                                    <p className="text-sm text-gray-600 italic">"{selectedReturn.description}"</p>
                                )}
                            </div>
                        </div>

                        {selectedReturn.orderDetails && (
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Order Details</p>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-900">{selectedReturn.orderDetails.name}</p>
                                            <p className="text-xs text-gray-500">{selectedReturn.orderDetails.phone}</p>
                                            <p className="text-xs text-gray-500">{selectedReturn.orderDetails.address}</p>
                                        </div>
                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium uppercase ${selectedReturn.orderDetails.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                                            }`}>
                                            {selectedReturn.orderDetails.status}
                                        </span>
                                    </div>

                                    {selectedReturn.orderDetails.order_items?.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-xs font-medium text-gray-500">Items in Order:</p>
                                            {selectedReturn.orderDetails.order_items.map((item: any) => (
                                                <div key={item.id} className={`flex flex-col gap-3 p-3 rounded-lg border ${selectedReturn.order_item_id === item.id ? 'bg-admin-accent/5 border-admin-accent/30' : 'bg-white border-gray-100'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 line-clamp-1">
                                                                {item.products?.name || 'Unknown Product'}
                                                                {selectedReturn.order_item_id === item.id && <span className="ml-2 text-[10px] text-admin-accent font-bold uppercase tracking-tight bg-admin-accent/10 px-1.5 py-0.5 rounded">Returned Item</span>}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-medium tracking-tight">Qty: {item.qty} × ₹{item.price}</p>
                                                        </div>
                                                        <p className="font-bold text-admin-primary">₹{item.qty * item.price}</p>
                                                    </div>

                                                    {selectedReturn.order_item_id === item.id && (
                                                        <div className="space-y-4 pt-3 border-t border-admin-accent/10">
                                                            <div>
                                                                <label htmlFor="admin-remark" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                                                    Admin Remark
                                                                </label>
                                                                <textarea
                                                                    id="admin-remark"
                                                                    rows={2}
                                                                    className="input w-full resize-none text-sm bg-white"
                                                                    placeholder="Add a remark for this action..."
                                                                    value={adminRemark}
                                                                    onChange={(e) => setAdminRemark(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="flex flex-wrap gap-1.5">
                                                                {['return_approved', 'return_rejected', 'pickup_scheduled', 'picked_up', 'qc_passed', 'qc_failed', 'refund_initiated', 'completed'].map((status) => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => handleUpdateStatus(selectedReturn.id, status)}
                                                                        disabled={selectedReturn.status === status || updatingStatus}
                                                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm
                                                                            ${selectedReturn.status === status || updatingStatus
                                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'
                                                                                : 'bg-white border border-gray-200 hover:bg-admin-accent hover:text-white hover:border-admin-accent'}`}
                                                                    >
                                                                        {status.replace(/_/g, ' ').toUpperCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedReturn.images && selectedReturn.images.length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Attachment Images</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedReturn.images.map((img: string, idx: number) => (
                                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded overflow-hidden border border-gray-200 hover:border-admin-accent">
                                            <img src={img} alt={`Return proof ${idx + 1}`} className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </Modal>
        </div>
    );
};
