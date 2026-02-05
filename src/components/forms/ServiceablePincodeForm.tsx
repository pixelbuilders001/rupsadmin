import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ServiceablePincodeFormProps {
    initialData?: any;
    onSuccess: () => void;
}

export const ServiceablePincodeForm: React.FC<ServiceablePincodeFormProps> = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        pincode: initialData?.pincode || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        is_active: initialData?.is_active ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.pincode.length !== 6) {
            toast.error('Pincode must be 6 digits');
            return;
        }

        try {
            setLoading(true);

            if (initialData?.id) {
                const { error } = await supabase
                    .from('serviceable_pincodes')
                    .update(formData)
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success('Pincode updated successfully');
            } else {
                const { error } = await supabase
                    .from('serviceable_pincodes')
                    .insert([formData]);
                if (error) {
                    if (error.code === '23505') {
                        toast.error('This pincode is already in the list');
                    } else {
                        throw error;
                    }
                } else {
                    toast.success('Pincode added successfully');
                }
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label">Pincode</label>
                <input
                    type="text"
                    className="input"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="e.g. 110001"
                    required
                    maxLength={6}
                />
            </div>
            <div>
                <label className="label">City</label>
                <input
                    type="text"
                    className="input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                    required
                />
            </div>
            <div>
                <label className="label">State</label>
                <input
                    type="text"
                    className="input"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Delhi"
                    required
                />
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="is_active"
                    className="rounded border-gray-300 text-admin-accent focus:ring-admin-accent"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
            </div>
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                >
                    {loading ? 'Saving...' : initialData ? 'Update Pincode' : 'Add Pincode'}
                </button>
            </div>
        </form>
    );
};
