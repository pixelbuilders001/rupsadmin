import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    bucket: string;
}

const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
        };
        reader.onerror = () => reject(new Error('File read failed'));
    });
};

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, bucket }) => {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            // Compress the image before upload
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

            const fileExt = 'jpg'; // Always use jpg after compression
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            toast.error(error.message || 'Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative w-40 h-40 group">
                    <img
                        src={value}
                        alt="Upload"
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Broken+Image';
                            console.error('Image failed to load:', value);
                        }}
                    />
                    <button
                        onClick={removeImage}
                        type="button"
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-admin-accent transition-all group">
                    {uploading ? (
                        <Loader2 className="animate-spin text-admin-accent" size={24} />
                    ) : (
                        <>
                            <Upload className="text-gray-400 group-hover:text-admin-accent mb-2" size={24} />
                            <span className="text-xs text-gray-500 group-hover:text-admin-accent font-medium">Click to upload</span>
                        </>
                    )}
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    );
};
