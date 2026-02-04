import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ImageUpload } from '../ui/ImageUpload';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    image_url: z.string().optional(),
    is_active: z.boolean().default(true),
    order: z.number().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    initialData?: any;
    onSuccess: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, onSuccess }) => {
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: initialData || {
            name: '',
            slug: '',
            description: '',
            image_url: '',
            is_active: true,
            order: 0,
        }
    });

    const imageUrl = watch('image_url');

    const onSubmit = async (values: CategoryFormValues) => {
        try {
            if (initialData) {
                const { error } = await supabase
                    .from('categories')
                    .update(values)
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success('Category updated');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([values]);
                if (error) throw error;
                toast.success('Category created');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Error saving category');
        }
    };

    const name = watch('name');
    React.useEffect(() => {
        if (name && !initialData) {
            setValue('slug', name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
        }
    }, [name, setValue, initialData]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Category Name</label>
                    <input {...register('name')} className="input" placeholder="e.g. Sarees" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Slug</label>
                    <input {...register('slug')} className="input" placeholder="sarees" />
                    {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea {...register('description')} className="input min-h-[100px]" placeholder="Brief description..." />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="space-y-2 flex-grow">
                    <label className="text-sm font-medium">Category Image</label>
                    <ImageUpload
                        bucket="categories"
                        value={imageUrl}
                        onChange={(url) => setValue('image_url', url)}
                    />
                </div>
                <div className="space-y-4 pt-2">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            {...register('is_active')}
                            className="w-4 h-4 text-admin-accent border-gray-300 rounded focus:ring-admin-accent"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                            Active Status
                        </label>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Display Order</label>
                        <input type="number" {...register('order', { valueAsNumber: true })} className="input w-24" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                >
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
                </button>
            </div>
        </form>
    );
};
