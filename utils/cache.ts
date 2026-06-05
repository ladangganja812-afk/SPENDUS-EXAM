
// Versi aplikasi saat ini. Ubah string ini setiap kali Anda melakukan deploy besar
// agar aplikasi otomatis membersihkan cache di browser pengguna.
export const cacheManager = {
  initialize: () => {},
  clearSession: () => {}
};

/**
 * Robust image URL processor to automatically convert shared Google Drive links
 * to direct raw image URLs that can be used in <img> tags.
 */
export const getSafeImageUrl = (url: string | undefined | null): string | undefined => {
    try {
        if (!url) return undefined;
        let trimmed = url.trim();
        if (!trimmed) return undefined;

        // Google Drive share link -> direct URL
        const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([-\w]+)/);
        if (gdriveMatch) {
            return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`;
        }
        
        // Convert old uc?id= format to lh3.googleusercontent.com format to fix broken caches
        const ucMatch = trimmed.match(/drive\.google\.com\/uc\?[-=&a-zA-Z0-9]*id=([-\w]+)/);
        if (ucMatch) {
             return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
        }

        // Force https for netlify deployment mixed-content error
        if (trimmed.startsWith('http://')) {
            trimmed = trimmed.replace('http://', 'https://');
        }

        return trimmed;
    } catch (e) {
        return undefined;
    }
};

