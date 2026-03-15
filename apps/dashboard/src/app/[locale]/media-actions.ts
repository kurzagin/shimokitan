'use server';

import { getDb, schema, eq } from '@shimokitan/db';
import { requireUser } from './auth-helpers';
import { uploadFileToR2 } from '@/lib/r2';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { revalidatePath } from 'next/cache';
import { storagePaths, generateStoragePath } from '@shimokitan/utils';

const encodeImageToBlurhash = async (buffer: Buffer): Promise<string> => {
    const { data, info } = await sharp(buffer)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
};

export async function uploadMediaAction(formData: FormData) {
    const user = await requireUser();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const contextType = formData.get('context') as 'entity_avatar' | 'artifact_asset' | 'work_asset' | 'general' || 'general';
    const contextId = formData.get('contextId') as string | null;

    if (!file && !url) throw new Error('No_File_Or_Url_Provided');

    let buffer: Buffer;
    let originalMimeType: string;
    let originalName: string;

    if (file && file.size > 0) {
        buffer = Buffer.from(await file.arrayBuffer());
        originalMimeType = file.type;
        originalName = file.name;
    } else if (url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed_To_Fetch_URL');
        buffer = Buffer.from(await response.arrayBuffer());
        originalMimeType = response.headers.get('content-type') || 'application/octet-stream';
        originalName = url.split(/[#?]/)[0].split('/').pop() || 'download';
    } else {
        throw new Error('Invalid_Input');
    }

    // Validate Size
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) throw new Error('File_Too_Large');

    const mediaId = nanoid();
    const isImage = originalMimeType.startsWith('image/') || originalName.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i);

    let processedBuffer = buffer;
    let mimeType = originalMimeType;
    let blurhashStr = null;
    let width = null;
    let height = null;
    let extension = originalName.split('.').pop() || 'bin';

    if (isImage) {
        // Optimize using Sharp
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Resize for avatars
        if (contextType === 'entity_avatar') {
            image.resize(1024, 1024, { fit: 'inside', withoutEnlargement: true });
        }

        // Convert to WebP
        processedBuffer = await image.webp({ quality: 80 }).toBuffer();
        mimeType = 'image/webp';
        extension = 'webp';

        const finalMetadata = await sharp(processedBuffer).metadata();
        width = finalMetadata.width || null;
        height = finalMetadata.height || null;

        // Generate Blurhash
        blurhashStr = await encodeImageToBlurhash(processedBuffer);
    }

    let key = '';
    if (contextType === 'entity_avatar') {
        key = storagePaths.userAvatar(contextId || mediaId, `${nanoid(8)}.${extension}`);
    } else if (contextType === 'work_asset') {
        key = storagePaths.workImage(contextId || mediaId, `${nanoid(8)}.${extension}`, contextId ? mediaId : undefined);
    } else {
        key = storagePaths.artifactImage(contextId || mediaId, `${nanoid(8)}.${extension}`, contextId ? mediaId : undefined);
    }

    // Upload optimized buffer to R2
    const publicUrl = await uploadFileToR2(processedBuffer, key, mimeType);

    // Register Media in DB
    await db.insert(schema.media).values({
        id: mediaId,
        type: isImage ? 'image' : 'document',
        url: publicUrl,
        r2Key: key,
        blurhash: blurhashStr,
        width,
        height,
        sizeBytes: processedBuffer.length,
        mimeType,
        uploaderId: user.id,
        isOrphan: true // Always orphan until parent action links it
    });

    return { mediaId, url: publicUrl, blurhash: blurhashStr };
}
