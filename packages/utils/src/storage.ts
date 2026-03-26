/**
 * R2 Storage Path Generation Utilities
 * 
 * Centralized logic for generating R2 object keys based on the Shimokitan storage schema.
 * Defines the folder structure for Artifacts, Echos, Zines, and Media types.
 * 
 * Schema: {media_type}/{context}/{identifier}/{filename}
 */

export type MediaType = 'images' | 'audio' | 'video' | 'dumps';
export type StorageContext = 'artifacts' | 'works' | 'zines' | 'profiles' | 'echos' | 'soundchecks' | 'metadata' | 'collections' | 'platforms';

interface PathOptions {
    mediaType: MediaType;
    context: StorageContext;
    identifier: string; // NanoID
    role?: string;      // Optional role for deeper grouping
    filename: string;   // NanoID + Extension
}

/**
 * Generates a fully qualified R2 storage path.
 * 
 * @param options - The path components
 * @returns The slash-separated path string
 * 
 * @example
 * generateStoragePath({ 
 *   mediaType: 'images', 
 *   context: 'artifacts', 
 *   identifier: 'shard_8z2k', 
 *   role: 'cover',
 *   filename: 'b1x9k2.webp' 
 * })
 * // Returns: "images/artifacts/shard_8z2k/cover/b1x9k2.webp"
 */
export const generateStoragePath = ({ mediaType, context, identifier, role, filename }: PathOptions): string => {
    const parts = ['media', mediaType, context, identifier];
    if (role) parts.push(role);
    parts.push(filename);
    return parts.join('/');
};


/**
 * Common path generators for specific use cases
 */
export const storagePaths = {
    /**
     * Path for an Artifact's cover image.
     * Note: filename should be a NanoID generated at upload time.
     */
    artifactImage: (artifactId: string, filename: string, role?: string) =>
        generateStoragePath({ mediaType: 'images', context: 'artifacts', identifier: artifactId, role, filename }),

    /**
     * Path for a Work's thumbnail or poster image.
     */
    workImage: (workId: string, filename: string, role?: string) =>
        generateStoragePath({ mediaType: 'images', context: 'works', identifier: workId, role, filename }),

    /**
     * Path for an Artifact's canonical audio file.
     */
    artifactAudio: (artifactId: string, filename: string, role?: string) =>
        generateStoragePath({ mediaType: 'audio', context: 'artifacts', identifier: artifactId, role, filename }),

    /**
     * Path for an Echo audio fragment.
     */
    echoAudio: (shardId: string, filename: string) =>
        generateStoragePath({ mediaType: 'audio', context: 'echos', identifier: shardId, filename }),

    /**
     * Path for a User's avatar/profile image.
     */
    userAvatar: (userId: string, filename: string) =>
        generateStoragePath({ mediaType: 'images', context: 'profiles', identifier: userId, filename }),

    /**
     * Path for a User's header/banner image.
     */
    userHeader: (userId: string, filename: string) =>
        generateStoragePath({ mediaType: 'images', context: 'profiles', identifier: userId, filename }),

    /**
     * Path for a Collection's cover image.
     */
    collectionImage: (collectionId: string, filename: string) =>
        generateStoragePath({ mediaType: 'images', context: 'collections', identifier: collectionId, filename }),

    /**
     * Path for a Zine layout asset.
     */
    zineImage: (zineId: string, filename: string) =>
        generateStoragePath({ mediaType: 'images', context: 'zines', identifier: zineId, filename }),

    /**
     * Path for a platform logo.
     */
    platformLogo: (platformId: string) =>
        `platform/${platformId}.webp`,

    /**
     * Path for unsupported files or failed uploads (Dumps).
     */
    artifactDump: (artifactId: string, filename: string, role?: string) =>
        generateStoragePath({ mediaType: 'dumps', context: 'artifacts', identifier: artifactId, role, filename }),
};
