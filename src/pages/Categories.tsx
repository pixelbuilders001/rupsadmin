import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Image as ImageIcon, Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { CategoryForm } from '../components/forms/CategoryForm';

export const Categories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
    const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category? This will fail if products are linked.')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) {
                if (error.code === '23503') {
                    toast.error('Cannot delete category: Products are linked to it.');
                } else {
                    throw error;
                }
            } else {
                toast.success('Category deleted');
                fetchCategories();
            }
        } catch (error: any) {
            toast.error(error.message || 'Error deleting category');
        }
    };

    const handleViewProducts = async (category: any) => {
        setSelectedCategoryForProducts(category);
        setIsProductsModalOpen(true);
        setLoadingProducts(true);
        setCurrentPage(1);

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('category_id', category.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCategoryProducts(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch products');
        } finally {
            setLoadingProducts(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Categories</h1>
                    <p className="text-admin-text-secondary mt-1">Manage your product categories and hierarchy.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="btn-primary flex items-center"
                >
                    <Plus size={18} className="mr-2" />
                    Add Category
                </button>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search categories..."
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="w-10 h-10 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : filteredCategories.length > 0 ? (
                                filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {cat.image_url ? (
                                                <img src={cat.image_url} alt={cat.name} className="w-10 h-10 rounded object-cover border border-gray-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-admin-primary">
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {cat.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {cat.is_active ? 'Active' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewProducts(cat)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="View Products"
                                                >
                                                    <Package size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
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
                                        {searchTerm ? `No categories matching "${searchTerm}"` : 'No categories found.'}
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
                title={selectedCategory ? 'Edit Category' : 'Add New Category'}
                maxWidth="lg"
            >
                <CategoryForm
                    initialData={selectedCategory}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchCategories();
                    }}
                />
            </Modal>

            {/* Products Modal */}
            <Modal
                isOpen={isProductsModalOpen}
                onClose={() => {
                    setIsProductsModalOpen(false);
                    setCategoryProducts([]);
                    setSelectedCategoryForProducts(null);
                }}
                title={`Products in "${selectedCategoryForProducts?.name}"`}
                maxWidth="4xl"
            >
                {loadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
                    </div>
                ) : categoryProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {categoryProducts
                                .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                                .map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-admin-accent transition-colors"
                                    >
                                        <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0 border border-gray-100 overflow-hidden">
                                            {product.thumbnail_url ? (
                                                <img
                                                    src={product.thumbnail_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Package size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-admin-primary truncate">
                                                {product.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 font-mono">SKU: {product.sku || 'N/A'}</p>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-sm font-bold text-admin-primary">₹{product.price}</span>
                                                <span className="text-xs text-gray-500">{product.stock} units</span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${product.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Pagination for Products */}
                        {categoryProducts.length > productsPerPage && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm text-gray-600">
                                    Showing {(currentPage - 1) * productsPerPage + 1} to{' '}
                                    {Math.min(currentPage * productsPerPage, categoryProducts.length)} of{' '}
                                    {categoryProducts.length} products
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {Math.ceil(categoryProducts.length / productsPerPage)}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(Math.ceil(categoryProducts.length / productsPerPage), prev + 1)
                                            )
                                        }
                                        disabled={currentPage === Math.ceil(categoryProducts.length / productsPerPage)}
                                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No products in this category</p>
                        <p className="text-sm mt-1">Add products to see them here</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

