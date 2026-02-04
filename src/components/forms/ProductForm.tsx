import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ImageUpload } from '../ui/ImageUpload';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    sale_price: z.number().nullable().optional(),
    category_id: z.string().min(1, 'Category is required'),
    stock: z.number().min(0).default(0),
    sku: z.string().optional(),
    thumbnail_url: z.string().optional(),
    images: z.array(z.string()).default([]),
    sizes: z.array(z.string()).default([]),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: any;
    onSuccess: () => void;
}

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSuccess }) => {
    const [categories, setCategories] = useState<any[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: initialData || {
            name: '',
            slug: '',
            description: '',
            price: 0,
            sale_price: null,
            category_id: '',
            stock: 0,
            sku: '',
            thumbnail_url: '',
            images: [],
            sizes: [],
            meta_title: '',
            meta_description: '',
            is_active: true,
            is_featured: false,
        }
    });

    const images = watch('images') || [];
    const thumbnail_url = watch('thumbnail_url');
    const selectedSizes = watch('sizes') || [];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('id, name').eq('is_active', true);
        setCategories(data || []);
    };

    const onSubmit = async (values: ProductFormValues) => {
        try {
            if (initialData) {
                const { error } = await supabase
                    .from('products')
                    .update(values)
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success('Product updated');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([values]);
                if (error) throw error;
                toast.success('Product created');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Error saving product');
        }
    };

    const name = watch('name');
    useEffect(() => {
        if (name && !initialData) {
            setValue('slug', name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [name, setValue, initialData]);

    const toggleSize = (size: string) => {
        const current = [...selectedSizes];
        const index = current.indexOf(size);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(size);
        }
        setValue('sizes', current);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">Product Name</label>
                    <input {...register('name')} className="input" placeholder="e.g. Silk Saree" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">Category</label>
                    <select {...register('category_id')} className="input text-sm">
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
                </div>
            </div>

            {/* Row 2: Identifiers & Pricing */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">Slug</label>
                    <input {...register('slug')} className="input text-sm" placeholder="url-slug" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">SKU</label>
                    <input {...register('sku')} className="input text-sm" placeholder="SKU001" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">Price (₹)</label>
                    <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="input text-sm" />
                    {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">Sale Price (₹)</label>
                    <input type="number" step="0.01" {...register('sale_price', { valueAsNumber: true })} className="input text-sm" />
                </div>
            </div>

            {/* Row 3: Description & Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-500">Description</label>
                    <textarea {...register('description')} className="input min-h-[80px] text-sm" placeholder="Product details..." />
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-gray-500">Stock Quantity</label>
                        <input type="number" {...register('stock', { valueAsNumber: true })} className="input text-sm" />
                    </div>
                    <div className="flex flex-col space-y-2 pt-1">
                        <div className="flex items-center">
                            <input type="checkbox" id="p_is_active" {...register('is_active')} className="w-4 h-4 text-admin-accent rounded" />
                            <label htmlFor="p_is_active" className="ml-2 text-sm font-medium">Active Status</label>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="p_is_featured" {...register('is_featured')} className="w-4 h-4 text-admin-accent rounded" />
                            <label htmlFor="p_is_featured" className="ml-2 text-sm font-medium">Featured Product</label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Left: Sizes & SEO */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-500">Available Sizes</label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_SIZES.map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => toggleSize(size)}
                                    className={`px-3 py-1 rounded border text-xs font-medium transition-colors
                                        ${selectedSizes.includes(size)
                                            ? 'bg-admin-accent border-admin-accent text-white'
                                            : 'bg-white border-gray-300 text-gray-700 hover:border-admin-accent'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SEO Settings</p>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Meta Title</label>
                                <input {...register('meta_title')} className="input h-9 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Meta Description</label>
                                <input {...register('meta_description')} className="input h-9 text-xs" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Images */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-gray-500">Product Media</label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Main</p>
                            <ImageUpload
                                bucket="product-images"
                                value={thumbnail_url}
                                onChange={(url) => setValue('thumbnail_url', url)}
                            />
                        </div>
                        {images.map((url, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={url} className="w-full h-full object-cover rounded-lg border" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newImages = [...images];
                                        newImages.splice(index, 1);
                                        setValue('images', newImages);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        {images.length < 3 && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Gall. {images.length + 1}</p>
                                <ImageUpload
                                    bucket="product-images"
                                    value=""
                                    onChange={(url) => setValue('images', [...images, url])}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-white">
                <button type="submit" disabled={isSubmitting} className="btn-primary px-10 py-2.5 text-sm">
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
                </button>
            </div>
        </form>
    );
};
