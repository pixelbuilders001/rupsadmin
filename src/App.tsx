import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { Toaster } from 'sonner';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Users } from './pages/Users';
import { Returns } from './pages/Returns';
import { Reviews } from './pages/Reviews';
import { ServiceablePincodes } from './pages/ServiceablePincodes';
import { Wishlists } from './pages/Wishlists';

// Placeholder components

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="products" element={<Products />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="users" element={<Users />} />
                        <Route path="returns" element={<Returns />} />
                        <Route path="reviews" element={<Reviews />} />
                        <Route path="serviceable-pincodes" element={<ServiceablePincodes />} />
                        <Route path="wishlists" element={<Wishlists />} />
                    </Route>
                </Routes>
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
