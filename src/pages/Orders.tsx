import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Eye, Filter, CheckCircle, Truck, PackageCheck, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Modal } from '../components/ui/Modal';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, any> = {
    pending: Clock,
    confirmed: CheckCircle,
    shipped: Truck,
    out_for_delivery: PackageCheck,
    delivered: PackageCheck,
    cancelled: XCircle,
};

export const Orders = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(name))')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingStatus(true);

            // Get the current user's session token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                throw new Error('You must be logged in to update order status');
            }

            const userToken = session.access_token;

            if (!userToken) {
                throw new Error('Authentication token not found. Please log in again.');
            }

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
                    order_id: orderId,
                    status: newStatus,
                    note: statusNote || `Status updated to ${newStatus} by admin`
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to update order status: ${errorData}`);
            }

            toast.success(`Order status updated to ${newStatus}`);
            setStatusNote('');
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                setIsModalOpen(false);
            }
        } catch (error: any) {
            console.error('Order status update error:', error);
            toast.error(error.message || 'Error updating order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Orders</h1>
                    <p className="text-admin-text-secondary mt-1">Track and manage customer orders.</p>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or code..."
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
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
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
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const Icon = statusIcons[order.status] || Clock;
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                #{order.order_code || order.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-admin-primary">{order.name}</div>
                                                <div className="text-xs text-gray-500">{order.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-admin-primary">
                                                ₹{order.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${statusColors[order.status]}`}>
                                                    <Icon size={12} className="mr-1" />
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
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
                                        No orders found.
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
                title="Order Details"
                maxWidth="2xl"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Information</p>
                                <h4 className="font-semibold text-lg">{selectedOrder.name}</h4>
                                <p className="text-sm text-gray-600">{selectedOrder.phone}</p>
                                <p className="text-sm text-gray-600 max-w-sm">{selectedOrder.address}</p>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Status</p>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColors[selectedOrder.status]}`}>
                                    {selectedOrder.status}
                                </span>
                                <p className="text-xs text-gray-500 block">Payment: {selectedOrder.payment_method}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Order Items</p>
                            <div className="space-y-3">
                                {selectedOrder.order_items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex-1">
                                            <p className="font-medium text-admin-primary">{item.products?.name}</p>
                                            <p className="text-gray-500 text-xs">Qty: {item.qty} × ₹{item.price}</p>
                                        </div>
                                        <p className="font-semibold">₹{item.qty * item.price}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <p className="font-bold text-admin-primary">Total Amount</p>
                                <p className="font-bold text-lg text-admin-accent">₹{selectedOrder.amount}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Update Order Status</p>

                            <div className="mb-4">
                                <label htmlFor="status-note" className="block text-sm font-medium text-gray-700 mb-2">
                                    Add Note (Optional)
                                </label>
                                <textarea
                                    id="status-note"
                                    rows={2}
                                    className="input w-full resize-none"
                                    placeholder="Add a note about this status change..."
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                                        disabled={selectedOrder.status === status || updatingStatus}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2
                      ${selectedOrder.status === status || updatingStatus
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-white border hover:bg-admin-accent hover:text-white hover:border-admin-accent'}`}
                                    >
                                        {updatingStatus && (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                        )}
                                        {status.replace(/_/g, ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
