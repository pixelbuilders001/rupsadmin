import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        const cached = localStorage.getItem('rupsadmin_is_admin');
        return cached === 'true';
    });
    const [loading, setLoading] = useState(true);
    const initialized = React.useRef(false);

    useEffect(() => {
        console.log('Auth: Initializing AuthProvider...');

        // Safety timeout to prevent permanent loading state
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('Auth: Initialization timed out, forcing loading to false');
                setLoading(false);
            }
        }, 5000);

        const handleAuthUpdate = async (session: any, eventSource: string) => {
            if (initialized.current && eventSource === 'INITIAL_GET_SESSION') return;

            console.log(`Auth: Handling session from ${eventSource}:`, session?.user ? 'User present' : 'No session');

            setUser(session?.user ?? null);

            if (session?.user) {
                // Background check if we already have a cached admin status
                const cachedAdmin = localStorage.getItem('rupsadmin_is_admin') === 'true';
                if (cachedAdmin && loading) {
                    console.log('Auth: Using cached admin status to unblock UI');
                    setLoading(false);
                }
                await checkAdminStatus(session.user.id);
            } else {
                setIsAdmin(false);
                localStorage.removeItem('rupsadmin_is_admin');
                setLoading(false);
            }

            initialized.current = true;
        };

        // 1. Initial session check
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) console.error('Auth: getSession error:', error.message);
            handleAuthUpdate(session, 'INITIAL_GET_SESSION');
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth: State change event:', event);

            // Wait for initial getSession to finish if it's the very first hit
            if (event === 'INITIAL_SESSION' && !initialized.current) {
                // handleAuthUpdate will be called by getSession results or this
                // but handleAuthUpdate protects against double init
            }

            handleAuthUpdate(session, `AUTH_CHANGE_${event}`);
        });

        return () => {
            console.log('Auth: Unmounting AuthProvider...');
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const checkAdminStatus = async (userId: string) => {
        console.log('Auth: Verifying admin status for:', userId);
        try {
            // Check if profile exists
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // If profile doesn't exist, create it
            if (error && error.code === 'PGRST116') {
                console.log('Auth: Profile not found, creating for first-time login...');

                // Check if this is the very first user in the system
                const { count: totalUsers } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                const isFirstUser = totalUsers === 0;
                console.log('Auth: Total users in system:', totalUsers, isFirstUser ? '(Making this user admin)' : '');

                const { data: { user } } = await supabase.auth.getUser();

                const newProfile = {
                    id: userId,
                    email: user?.email,
                    full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                    avatar_url: user?.user_metadata?.avatar_url,
                    is_admin: isFirstUser, // First user is admin
                };

                const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (createError) {
                    throw createError;
                }
                data = createdProfile;
            } else if (error) {
                throw error;
            }

            const adminStatus = data && 'is_admin' in data ? !!data.is_admin : false;
            console.log('Auth: Admin status resolved:', adminStatus);

            // Persist the admin status
            setIsAdmin(adminStatus);
            localStorage.setItem('rupsadmin_is_admin', adminStatus ? 'true' : 'false');
        } catch (error: any) {
            console.error('Auth: Admin check exception:', error.message);
            // If check fails, we fallback to non-admin
            setIsAdmin(false);
            localStorage.removeItem('rupsadmin_is_admin');
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        console.log('Auth: Signing out...');
        await supabase.auth.signOut();
        localStorage.removeItem('rupsadmin_is_admin');
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
