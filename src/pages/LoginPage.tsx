import React from 'react';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const LoginPage = () => {
    const { user, isAdmin } = useAuth();

    if (user) {
        if (isAdmin) {
            return <Navigate to="/" replace />;
        }
        return (
            <div className="min-h-screen flex items-center justify-center bg-admin-background px-4">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
                    <h2 className="text-2xl font-bold text-admin-primary">Access Denied</h2>
                    <p className="text-admin-text-secondary">
                        You are signed in as <span className="font-semibold">{user.email}</span>, but you do not have admin privileges.
                    </p>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="btn-secondary w-full"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message || 'Failed to login with Google');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-admin-background px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-admin-primary tracking-tight">
                        Admin Portal
                    </h2>
                    <p className="mt-3 text-admin-text-secondary">
                        Sign in with your Google account to manage your storefront
                    </p>
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleGoogleLogin}
                        className="btn-primary w-full py-3.5 flex items-center justify-center text-base font-medium"
                    >
                        <img
                            className="h-5 w-5 mr-3"
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                        />
                        Sign in with Google
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Only authorized admin accounts can access this portal
                    </p>
                </div>
            </div>
        </div>
    );
};
