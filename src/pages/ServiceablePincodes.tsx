import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { ServiceablePincodeForm } from '../components/forms/ServiceablePincodeForm';

export const ServiceablePincodes = () => {
    const [pincodes, setPincodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPincode, setSelectedPincode] = useState<any>(null);

    useEffect(() => {
        fetchPincodes();
    }, []);

    const fetchPincodes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('serviceable_pincodes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPincodes(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch pincodes');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pincode: any) => {
        setSelectedPincode(pincode);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedPincode(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this pincode?')) return;

        try {
            const { error } = await supabase
                .from('serviceable_pincodes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Pincode deleted');
            fetchPincodes();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting pincode');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('serviceable_pincodes')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Pincode ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchPincodes();
        } catch (error: any) {
            toast.error(error.message || 'Error updating status');
        }
    };

    const filteredPincodes = pincodes.filter(item =>
        item.pincode.includes(searchTerm) ||
        item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.state?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Serviceable Pincodes</h1>
                    <p className="text-admin-text-secondary mt-1">Manage areas where services are available.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="btn-primary flex items-center"
                >
                    <Plus size={18} className="mr-2" />
                    Add Pincode
                </button>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search pincode, city or state..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredPincodes.length > 0 ? (
                                filteredPincodes.map((item) => (
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
                                            <button
                                                onClick={() => toggleStatus(item.id, item.is_active)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.is_active
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                    }`}
                                            >
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-gray-400 hover:text-admin-danger transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        <div className="flex flex-col items-center justify-center">
                                            <MapPin size={48} className="text-gray-200 mb-2" />
                                            {searchTerm ? `No pincodes matching "${searchTerm}"` : 'No serviceable pincodes found.'}
                                        </div>
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
                title={selectedPincode ? 'Edit Pincode' : 'Add New Pincode'}
                maxWidth="md"
            >
                <ServiceablePincodeForm
                    initialData={selectedPincode}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchPincodes();
                    }}
                />
            </Modal>
        </div>
    );
};
