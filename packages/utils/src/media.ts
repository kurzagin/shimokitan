/**
 * Extracts the video/content ID from various platform URLs.
 * Focuses on YouTube, but designed to be extensible.
 */
export function extractMediaId(url: string, platform: string): string | null {
    if (!url) return null;

    const trimmedUrl = url.trim();

    switch (platform.toLowerCase()) {
        case 'youtube':
        case 'youtube_music': {
            // Patterns matched:
            // youtube.com/watch?v=ID
            // youtu.be/ID
            // youtube.com/embed/ID
            // youtube.com/v/ID
            // youtube.com/shorts/ID
            // music.youtube.com/watch?v=ID
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = trimmedUrl.match(regex);
            return match ? match[1] : null;
        }

        case 'bilibili': {
            // Patterns matched:
            // bilibili.com/video/BV...
            // bilibili.com/video/av...
            const bvidMatch = trimmedUrl.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
            if (bvidMatch) return bvidMatch[1];

            const avidMatch = trimmedUrl.match(/\/video\/(av[0-9]+)/i);
            if (avidMatch) return avidMatch[1];

            return null;
        }

        case 'niconico': {
            // Patterns matched:
            // nicovideo.jp/watch/sm...
            const match = trimmedUrl.match(/\/watch\/(sm[0-9]+)/i);
            return match ? match[1] : null;
        }

        default:
            return null;
    }
}

/**
 * Generates a thumbnail URL for a given platform ID.
 */
export function getThumbnailUrl(id: string | null, platform: string): string | null {
    if (!id) return null;

    switch (platform.toLowerCase()) {
        case 'youtube':
        case 'youtube_music':
            return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        case 'bilibili':
            // Bilibili doesn't have a simple predictable thumbnail pattern like YouTube 
            // without API calls, so we return null for now.
            return null;
        case 'niconico':
            return `https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}.L`;
        default:
            return null;
    }
}

/**
 * Generates a Cloudflare-optimized image URL.
 * Applies WebP format and 80% quality by default as per Phase 1 requirements.
 * 
 * @param url - The original image URL (R2 or external)
 * @param options - Transformation options (width, height, fit, quality)
 */
export function getOptimizedImageUrl(
    url: string | null,
    options: { width?: number; height?: number; fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'; quality?: number } = {}
): string | null {
    if (!url) return null;

    // Use default quality 80 if not specified
    const quality = options.quality ?? 80;
    const params = [`format=webp`, `quality=${quality}`];

    if (options.width) params.push(`width=${options.width}`);
    if (options.height) params.push(`height=${options.height}`);
    if (options.fit) params.push(`fit=${options.fit}`);

    // Cloudflare Image Resizing endpoint
    // Format: /cdn-cgi/image/{params}/{url}
    return `/cdn-cgi/image/${params.join(',')}/${url}`;
}

/**
 * Returns the CDN URL for a platform icon.
 * Assets are served from cdn.shimokitan.live/images/platforms/{id}.webp
 */
export function getBrandIconUrl(platformId: string | null): string | null {
    if (!platformId) return null;

    // Normalize platform ID (e.g. 'ko_fi' -> 'ko-fi') but mostly we expect NanoIDs now.
    const normalizedId = platformId.toLowerCase().replace(/_/g, '-');

    return `https://cdn.shimokitan.live/media/images/platforms/${normalizedId}.webp`;
}

/**
 * Global registry of supported external platforms for consistent 
 * meta-mapping between Sector, Protocol, and Gateway.
 */
export const PLATFORM_REGISTRY = [
    { id: 'youtube', name: 'YouTube', category: 'video', defaultRole: 'video' },
    { id: 'bilibili', name: 'Bilibili', category: 'video', defaultRole: 'video' },
    { id: 'niconico', name: 'Niconico', category: 'video', defaultRole: 'video' },
    { id: 'crunchyroll', name: 'Crunchyroll', category: 'video', defaultRole: 'video' },
    { id: 'netflix', name: 'Netflix', category: 'video', defaultRole: 'video' },
    { id: 'amazon_prime', name: 'Amazon Prime', category: 'video', defaultRole: 'video' },
    
    { id: 'spotify', name: 'Spotify', category: 'audio', defaultRole: 'audio' },
    { id: 'soundcloud', name: 'Soundcloud', category: 'audio', defaultRole: 'audio' },
    { id: 'apple_music', name: 'Apple Music', category: 'audio', defaultRole: 'audio' },
    { id: 'bandcamp', name: 'Bandcamp', category: 'audio', defaultRole: 'audio' },
    
    { id: 'x', name: 'X', category: 'social', defaultRole: 'social' },
    { id: 'instagram', name: 'Instagram', category: 'social', defaultRole: 'social' },
    { id: 'tiktok', name: 'TikTok', category: 'social', defaultRole: 'social' },
    { id: 'pixiv', name: 'Pixiv', category: 'social', defaultRole: 'social' },
    
    { id: 'booth', name: 'BOOTH', category: 'commerce', defaultRole: 'commerce' },
    { id: 'fanbox', name: 'Fanbox', category: 'commerce', defaultRole: 'commerce' },
    { id: 'ko_fi', name: 'Ko-fi', category: 'commerce', defaultRole: 'commerce' },
    { id: 'vgen', name: 'VGen', category: 'commerce', defaultRole: 'commerce' },
    { id: 'skeb', name: 'Skeb', category: 'commerce', defaultRole: 'commerce' },
    { id: 'patreon', name: 'Patreon', category: 'commerce', defaultRole: 'commerce' },
    { id: 'steam', name: 'Steam', category: 'commerce', defaultRole: 'commerce' },
    
    { id: 'r2', name: 'Internal Vault', category: 'other', defaultRole: 'hosted_audio' },
    { id: 'other', name: 'Other Source', category: 'other', defaultRole: 'reference' },
] as const;

export type PlatformId = (typeof PLATFORM_REGISTRY)[number]['id'];

/**
 * Detects the platform and metadata from a given URL.
 */
export function detectPlatformFromUrl(url: string | null): { 
    platform: PlatformId; 
    category: string; 
    role: string;
} | null {
    if (!url) return null;
    const v = url.toLowerCase();

    if (v.includes('youtube.com/') || v.includes('youtu.be/')) return { platform: 'youtube', category: 'video', role: 'video' };
    if (v.includes('spotify.com/')) return { platform: 'spotify', category: 'audio', role: 'audio' };
    if (v.includes('soundcloud.com/')) return { platform: 'soundcloud', category: 'audio', role: 'audio' };
    if (v.includes('apple.com/')) return { platform: 'apple_music', category: 'audio', role: 'audio' };
    if (v.includes('bilibili.com/')) return { platform: 'bilibili', category: 'video', role: 'video' };
    if (v.includes('nicovideo.jp/')) return { platform: 'niconico', category: 'video', role: 'video' };
    if (v.includes('x.com/')) return { platform: 'x', category: 'social', role: 'social' };
    if (v.includes('ko-fi.com/')) return { platform: 'ko_fi', category: 'commerce', role: 'commerce' };
    if (v.includes('booth.pm/')) return { platform: 'booth', category: 'commerce', role: 'commerce' };
    if (v.includes('vgen.co/')) return { platform: 'vgen', category: 'commerce', role: 'commerce' };
    if (v.includes('skeb.jp/')) return { platform: 'skeb', category: 'commerce', role: 'commerce' };
    if (v.includes('patreon.com/')) return { platform: 'patreon', category: 'commerce', role: 'commerce' };
    if (v.includes('fanbox.cc/')) return { platform: 'fanbox', category: 'commerce', role: 'commerce' };
    if (v.includes('pixiv.net/')) return { platform: 'pixiv', category: 'social', role: 'social' };
    if (v.includes('bandcamp.com/')) return { platform: 'bandcamp', category: 'audio', role: 'audio' };
    if (v.includes('instagram.com/')) return { platform: 'instagram', category: 'social', role: 'social' };
    if (v.includes('tiktok.com/')) return { platform: 'tiktok', category: 'social', role: 'social' };
    if (v.includes('crunchyroll.com/')) return { platform: 'crunchyroll', category: 'video', role: 'video' };
    if (v.includes('netflix.com/')) return { platform: 'netflix', category: 'video', role: 'video' };
    if (v.includes('steampowered.com/') || v.includes('steamcommunity.com/')) return { platform: 'steam', category: 'commerce', role: 'commerce' };
    if (v.includes('amazon.com/') && (v.includes('prime') || v.includes('video'))) return { platform: 'amazon_prime', category: 'video', role: 'video' };

    return null;
}
