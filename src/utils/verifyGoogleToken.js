export const extractEmailFromGoogleToken = (token) => {
    try {
        if (!token) return null;

        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        // Convert base64url → base64
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Decode base64 safely (Node vs Browser)
        let payloadJson;
        if (typeof window === 'undefined') {
            // Node.js
            payloadJson = Buffer.from(base64, 'base64').toString('utf-8');
        } else {
            // Browser
            payloadJson = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
        }

        const payload = JSON.parse(payloadJson);
        return payload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};