import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Search, Filter, Hash, Tag, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { ProductForm } from '../components/forms/ProductForm';

export const Products = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (product: any) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !product.is_active })
                .eq('id', product.id);

            if (error) throw error;
            toast.success(`Product ${product.is_active ? 'disabled' : 'enabled'}`);
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message || 'Error updating status');
        }
    };

    const handleDelete = async (product: any) => {
        if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (error) throw error;
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting product');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .in('id', selectedProducts);

            if (error) throw error;
            toast.success(`${selectedProducts.length} product(s) deleted successfully`);
            setSelectedProducts([]);
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting products');
        }
    };

    const toggleSelectProduct = (productId: string) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedProducts.length === currentProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(currentProducts.map(p => p.id));
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-admin-primary">Products</h1>
                    <p className="text-admin-text-secondary mt-1">Manage your inventory, pricing and visibility.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedProducts.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn-secondary flex items-center bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        >
                            <Trash2 size={18} className="mr-2" />
                            Delete ({selectedProducts.length})
                        </button>
                    )}
                    <button
                        onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
                        className="btn-primary flex items-center"
                    >
                        <Plus size={18} className="mr-2" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-secondary flex items-center lg:px-6">
                        <Filter size={18} className="mr-2" />
                        Category
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={currentProducts.length > 0 && selectedProducts.length === currentProducts.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-admin-accent rounded border-gray-300 focus:ring-admin-accent"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="flex items-center"><div className="w-12 h-12 bg-gray-200 rounded mr-3"></div><div className="h-4 w-32 bg-gray-100 rounded"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 ml-auto bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : currentProducts.length > 0 ? (
                                currentProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => toggleSelectProduct(product.id)}
                                                className="w-4 h-4 text-admin-accent rounded border-gray-300 focus:ring-admin-accent"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 border border-gray-100 overflow-hidden">
                                                    {product.thumbnail_url ? (
                                                        <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Tag size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-admin-primary">{product.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">SKU: {product.sku || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {product.categories?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-admin-primary">₹{product.sale_price}</div>
                                            {product.sale_price && (
                                                <div className="text-xs text-red-500 line-through">₹{product.price}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`font-medium ${product.stock < 10 ? 'text-orange-600' : 'text-gray-600'}`}>
                                                {product.stock} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleStatus(product)}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                    title={product.is_active ? 'Disable' : 'Enable'}
                                                >
                                                    {product.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                                                    className="p-2 text-gray-400 hover:text-admin-accent transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredProducts.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                            <span className="font-medium">{filteredProducts.length}</span> products
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${currentPage === page
                                            ? 'bg-admin-accent text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedProduct ? 'Edit Product' : 'Add New Product'}
                maxWidth="4xl"
            >
                <ProductForm
                    initialData={selectedProduct}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchProducts();
                    }}
                />
            </Modal>
        </div>
    );
};
