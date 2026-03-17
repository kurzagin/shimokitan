
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storagePaths, nanoid } from '@shimokitan/utils';
import { Buffer } from 'node:buffer';

// Helper to get R2 domain
const R2_DOMAIN = process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://cdn.shimokitan.live';

// S3 Client for R2 initialization
let s3Client: S3Client | null = null;

/**
 * Internal helper to get the S3 Client for Cloudflare R2.
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
 * Uploads an image from a URL to R2.
 * Mirror-or-Bust: All external assets must be mirrored to our internal storage.
 * returns the public URL of the uploaded asset.
 */
export async function uploadImageFromUrl(
    url: string,
    contextId: string,
    type: 'artifact' | 'zine' | 'profile' | 'collection' = 'artifact'
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

        if (type === 'artifact') {
            key = storagePaths.artifactImage(contextId, filename);
        } else if (type === 'zine') {
            key = storagePaths.zineImage(contextId, filename);
        } else if (type === 'profile') {
            key = storagePaths.userAvatar(contextId, filename);
        } else if (type === 'collection') {
            key = storagePaths.collectionImage(contextId, filename);
        } else {
            throw new Error('INVALID_CONTEXT: Unknown upload type');
        }

        await uploadFileToR2(buffer, key, contentType);

        return `${R2_DOMAIN}/${key}`;

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[R2_MIRROR_FAILURE]', error);
        }
        throw error;
    }
}

/**
 * Uploads a raw file/buffer to R2 via S3 SDK.
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
 * Generates a presigned URL for direct client-side upload to R2.
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
