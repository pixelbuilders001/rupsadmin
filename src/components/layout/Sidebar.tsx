import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Tag,
    Package,
    ShoppingCart,
    Users,
    ChevronLeft,
    Menu,
    LogOut,
    RefreshCw,
    Star
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Tag, label: 'Categories', path: '/categories' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: RefreshCw, label: 'Returns', path: '/returns' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    { icon: Users, label: 'Users', path: '/users' },
];

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const { signOut } = useAuth();

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu size={20} />
            </button>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-admin-primary text-white transition-transform duration-300 transform lg:translate-x-0",
                !isOpen && "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="p-6 flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-tight">RUPS ADMIN</h1>
                        <button
                            className="lg:hidden"
                            onClick={() => setIsOpen(false)}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => cn(
                                    "flex items-center px-4 py-3 rounded-lg transition-colors group",
                                    isActive
                                        ? "bg-admin-accent text-white"
                                        : "text-gray-400 hover:bg-admin-secondary hover:text-white"
                                )}
                            >
                                <item.icon className="mr-3" size={20} />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer / Sign Out */}
                    <div className="p-4 border-t border-gray-800">
                        <button
                            onClick={signOut}
                            className="flex items-center w-full px-4 py-3 text-gray-400 rounded-lg hover:bg-admin-danger/10 hover:text-admin-danger transition-colors group"
                        >
                            <LogOut className="mr-3" size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
