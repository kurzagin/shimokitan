import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storagePaths, nanoid } from '@shimokitan/utils';
import { Buffer } from 'node:buffer';

/**
 * R2 Storage Domain
 * Defaults to the Shimokitan production CDN if not specified.
 */
const R2_DOMAIN = process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://cdn.shimokitan.live';

let s3Client: S3Client | null = null;

/**
 * Internal helper to get the S3 Client for Cloudflare R2.
 * Initializes the client lazily using environment variables.
 */
function getS3Client() {
    if (s3Client) return s3Client;

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error("R2_CONFIG_MISSING: Ensure R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are defined.");
    }

    s3Client = new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    return s3Client;
}

/**
 * Mirror-or-Bust: Uploads an image from an external URL to R2.
 * This ensures assets are hosted locally for performance and longevity.
 * 
 * @param url - The external image URL to fetch and mirror
 * @param contextId - The ID of the context (artifact, profile, etc.)
 * @param type - The storage context type
 * @returns The final public CDN URL of the mirrored asset
 */
export async function uploadImageFromUrl(
    url: string,
    contextId: string,
    type: 'artifact' | 'zine' | 'profile' | 'collection' | 'work' = 'artifact'
): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FETCH_FAILED: External source returned ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/webp';

        const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
        if (buffer.length > MAX_SIZE) {
            throw new Error(`FILE_TOO_LARGE: Asset must be under 10MB (Detected: ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
        }

        const extension = contentType.split('/').pop()?.split('+')[0] || 'webp';
        const filename = `${nanoid()}.${extension}`;
        let key = '';

        switch (type) {
            case 'artifact':
                key = storagePaths.artifactImage(contextId, filename);
                break;
            case 'work':
                key = storagePaths.workImage(contextId, filename);
                break;
            case 'zine':
                key = storagePaths.zineImage(contextId, filename);
                break;
            case 'profile':
                key = storagePaths.userAvatar(contextId, filename);
                break;
            case 'collection':
                key = storagePaths.collectionImage(contextId, filename);
                break;
            default:
                throw new Error('INVALID_CONTEXT: Unknown upload type');
        }

        return await uploadFileToR2(buffer, key, contentType);

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[R2_MIRROR_FAILURE]', error);
        }
        throw error;
    }
}

/**
 * Core utility to upload a file (Buffer, ArrayBuffer, or string) to R2.
 * 
 * @param file - The file content
 * @param key - The R2 object key (path)
 * @param contentType - MIME type of the file
 * @returns The final public CDN URL
 */
export async function uploadFileToR2(
    file: Buffer | ArrayBuffer | string,
    key: string,
    contentType: string = 'image/webp'
): Promise<string> {
    const client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME || 'shimokitan';
    
    const body = Buffer.isBuffer(file) 
        ? file 
        : typeof file === 'string' 
            ? Buffer.from(file) 
            : Buffer.from(file);

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await client.send(command);

    return `${R2_DOMAIN}/${key}`;
}

/**
 * Generates a presigned URL for secure, direct client-side uploads to R2.
 * 
 * @param key - The R2 object key
 * @param contentType - Expected MIME type
 * @param expiresIn - Expiry in seconds (default: 1 hour)
 * @returns The presigned PUT URL
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> {
    const client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME || 'shimokitan';

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Core utility to delete a file from R2.
 * 
 * @param key - The R2 object key (path)
 */
export async function deleteFileFromR2(key: string): Promise<void> {
    const client = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME || 'shimokitan';

    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    await client.send(command);
}

export { R2_DOMAIN };
