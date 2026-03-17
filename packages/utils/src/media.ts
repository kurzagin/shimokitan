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

    return `https://cdn.shimokitan.live/images/platforms/${normalizedId}.webp`;
}
