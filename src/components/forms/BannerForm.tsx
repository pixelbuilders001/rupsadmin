import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { ImageUpload } from '../ui/ImageUpload';
import { Loader2 } from 'lucide-react';

const bannerSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    image_url: z.string().min(1, 'Desktop image is required'),
    mobile_image_url: z.string().optional(),
    cta_text: z.string().optional(),
    cta_link: z.string().optional(),
    position: z.number().default(1),
    is_active: z.boolean().default(true),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
    initialData?: any;
    onSuccess: () => void;
}

export const BannerForm: React.FC<BannerFormProps> = ({ initialData, onSuccess }) => {
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: initialData?.title || '',
            subtitle: initialData?.subtitle || '',
            image_url: initialData?.image_url || '',
            mobile_image_url: initialData?.mobile_image_url || '',
            cta_text: initialData?.cta_text || '',
            cta_link: initialData?.cta_link || '',
            position: initialData?.position || 1,
            is_active: initialData?.is_active ?? true,
            start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
            end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '',
        }
    });

    const imageUrl = watch('image_url');
    const mobileImageUrl = watch('mobile_image_url');

    const onSubmit = async (values: BannerFormValues) => {
        try {
            const dataToSave = {
                ...values,
                start_date: values.start_date || null,
                end_date: values.end_date || null,
                updated_at: new Date().toISOString(),
            };

            if (initialData?.id) {
                const { error } = await supabase
                    .from('hero_banners')
                    .update(dataToSave)
                    .eq('id', initialData.id);

                if (error) throw error;
                toast.success('Banner updated successfully');
            } else {
                const { error } = await supabase
                    .from('hero_banners')
                    .insert([{ ...dataToSave, created_at: new Date().toISOString() }]);

                if (error) throw error;
                toast.success('Banner created successfully');
            }

            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Error saving banner');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="label">Title *</label>
                        <input
                            type="text"
                            className="input"
                            {...register('title')}
                            placeholder="Enter banner title"
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="label">Subtitle</label>
                        <input
                            type="text"
                            className="input"
                            {...register('subtitle')}
                            placeholder="Enter banner subtitle"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">CTA Text</label>
                            <input
                                type="text"
                                className="input"
                                {...register('cta_text')}
                                placeholder="Shop Now"
                            />
                        </div>
                        <div>
                            <label className="label">CTA Link</label>
                            <input
                                type="text"
                                className="input"
                                {...register('cta_link')}
                                placeholder="/products"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Position</label>
                            <input
                                type="number"
                                className="input"
                                {...register('position', { valueAsNumber: true })}
                                min="1"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <input
                                type="checkbox"
                                id="is_active"
                                {...register('is_active')}
                                className="w-4 h-4 text-admin-accent border-gray-300 rounded focus:ring-admin-accent outline-none"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="label">Desktop Image * (1920x600 recommended)</label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={(url) => setValue('image_url', url, { shouldValidate: true, shouldDirty: true })}
                            bucket="banner-images"
                        />
                        {errors.image_url && <p className="text-xs text-red-500 mt-1">{errors.image_url.message}</p>}
                    </div>

                    <div>
                        <label className="label">Mobile Image (800x800 recommended)</label>
                        <ImageUpload
                            value={mobileImageUrl}
                            onChange={(url) => setValue('mobile_image_url', url, { shouldValidate: true, shouldDirty: true })}
                            bucket="banner-images"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="label">Start Date</label>
                    <input
                        type="datetime-local"
                        className="input"
                        {...register('start_date')}
                    />
                </div>
                <div>
                    <label className="label">End Date</label>
                    <input
                        type="datetime-local"
                        className="input"
                        {...register('end_date')}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center min-w-[120px] justify-center"
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin mr-2" size={18} />
                    ) : initialData ? 'Update Banner' : 'Create Banner'}
                </button>
            </div>
        </form>
    );
};
