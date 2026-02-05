
export const getURL = () => {
    let url =
        process?.env?.VITE_PUBLIC_SITE_URL ?? // Use custom env if set
        process?.env?.VITE_PUBLIC_VERCEL_URL ?? // Auto-detected on Vercel
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;

    // Ensure trailing slash
    return url.endsWith('/') ? url : `${url}/`;
}