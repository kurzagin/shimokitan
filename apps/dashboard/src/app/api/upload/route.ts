
import { NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/r2';
import { requireArchitect } from '@/app/[locale]/auth-helpers';
import { storagePaths, nanoid } from '@shimokitan/utils';

/**
 * Enterprise-Grade Upload API (Dashboard Instance)
 * Generates presigned URLs for direct browser-to-R2 uploads.
 * 
 * Pattern: cdn.shimokitan.live/[type]/[context]/[context_id]/[filename].[ext]
 */
export async function POST(req: Request) {
    try {
        await requireArchitect();

        const { filename, contentType, context, contextId, role, preserveFilename } = await req.json();

        if (!filename || !contentType || !context || !contextId) {
            return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 });
        }

        const extension = filename.split('.').pop() || 'bin';
        const finalFilename = preserveFilename ? filename : `${nanoid()}.${extension}`;
        const mediaId = nanoid(); // Subfolder isolation
        
        let key = '';

        switch (context) {
            case 'artifacts':
                if (contentType.startsWith('image/')) {
                    key = storagePaths.artifactImage(contextId, finalFilename, role || mediaId);
                } else if (contentType.startsWith('audio/') || contentType === 'application/x-mpegURL' || filename.endsWith('.m3u8') || filename.endsWith('.m4s') || filename.endsWith('.ts') || filename.endsWith('.m4a')) {
                    // For HLS/Audio, path them into the audio folder.
                    key = storagePaths.artifactAudio(contextId, finalFilename, role || mediaId);
                } else {
                    key = `raw/artifacts/${contextId}/${role || mediaId}/${finalFilename}`;
                }
                break;
            case 'profiles':
                key = storagePaths.userAvatar(contextId, finalFilename);
                break;
            case 'zines':
                key = storagePaths.zineImage(contextId, finalFilename);
                break;
            case 'collections':
                key = storagePaths.collectionImage(contextId, finalFilename);
                break;
            default:
                return NextResponse.json({ error: 'INVALID_CONTEXT' }, { status: 400 });
        }

        const uploadUrl = await getPresignedUploadUrl(key, contentType);

        return NextResponse.json({
            uploadUrl,
            key,
            url: `${process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://cdn.shimokitan.live'}/${key}`,
            filename: finalFilename
        });

    } catch (error: any) {
        console.error('[UPLOAD_API_FAILURE]', error);
        return NextResponse.json({ 
            error: error.message === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'UPLOAD_INITIALIZATION_FAILED' 
        }, { status: error.message === 'UNAUTHORIZED' ? 401 : 500 });
    }
}
