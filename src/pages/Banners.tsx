import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Image as ImageIcon, Search, Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { BannerForm } from '../components/forms/BannerForm';
import { format } from 'date-fns';

export const Banners = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<any>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('hero_banners')
                .select('*')
                .order('position', { ascending: true });

            if (error) throw error;
            setBanners(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner: any) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedBanner(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;

        try {
            const { error } = await supabase
                .from('hero_banners')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Banner deleted');
            fetchBanners();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting banner');
        }
    };

    const toggleStatus = async (banner: any) => {
        try {
            const { error } = await supabase
                .from('hero_banners')
                .update({ is_active: !banner.is_active, updated_at: new Date().toISOString() })
                .eq('id', banner.id);

            if (error) throw error;

            toast.success(`Banner ${banner.is_active ? 'deactivated' : 'activated'}`);
            fetchBanners();
        } catch (error: any) {
            toast.error(error.message || 'Error updating status');
        }
    };

    const filteredBanners = banners.filter(banner =>
        banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Hero Banners</h1>
                    <p className="text-admin-text-secondary mt-1">Manage the hero section carousels and promotional banners.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="btn-primary flex items-center"
                >
                    <Plus size={18} className="mr-2" />
                    Add Banner
                </button>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search banners..."
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title / Subtitle</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="w-20 h-10 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded mb-2"></div><div className="h-3 w-24 bg-gray-50 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredBanners.length > 0 ? (
                                filteredBanners.map((banner) => (
                                    <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                {banner.image_url ? (
                                                    <img src={banner.image_url} alt="Desktop" className="w-20 h-10 rounded object-cover border border-gray-100" title="Desktop Image" />
                                                ) : (
                                                    <div className="w-20 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-100">
                                                        <ImageIcon size={16} />
                                                    </div>
                                                )}
                                                {banner.mobile_image_url && (
                                                    <img src={banner.mobile_image_url} alt="Mobile" className="w-10 h-10 rounded object-cover border border-gray-100" title="Mobile Image" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-admin-primary">{banner.title}</div>
                                            {banner.subtitle && <div className="text-xs text-gray-500 truncate max-w-[200px]">{banner.subtitle}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {banner.position}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            <div className="space-y-1">
                                                <div className="flex items-center">
                                                    <span className="w-10">Start:</span>
                                                    <span>{banner.start_date ? format(new Date(banner.start_date), 'MMM dd, yyyy') : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-10">End:</span>
                                                    <span>{banner.end_date ? format(new Date(banner.end_date), 'MMM dd, yyyy') : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleStatus(banner)}
                                                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${banner.is_active
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                    }`}
                                            >
                                                {banner.is_active ? (
                                                    <><CheckCircle2 size={12} /> <span>Active</span></>
                                                ) : (
                                                    <><XCircle size={12} /> <span>Inactive</span></>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(banner)}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner.id)}
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
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                        {searchTerm ? `No banners matching "${searchTerm}"` : 'No banners found.'}
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
                title={selectedBanner ? 'Edit Banner' : 'Add New Banner'}
                maxWidth="3xl"
            >
                <BannerForm
                    initialData={selectedBanner}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchBanners();
                    }}
                />
            </Modal>
        </div>
    );
};
