
"use client"

import React, { useState } from 'react';
import { createVerification, updateVerification } from '../actions';
import { useRouter } from 'next/navigation';
import { authClient } from '@shimokitan/auth';

type Option = { id: string, name: string };

export default function VerificationForm({
    artifacts,
    entities,
    initialData
}: {
    artifacts: Option[],
    entities: Option[],
    initialData?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
}) {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [targetType, setTargetType] = useState<'artifact' | 'entity'>(initialData?.targetType || 'artifact');

    const defaultAuthorizedBy = initialData?.grantedBy || session?.user?.name || session?.user?.email || '';

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            const expiresAtValue = formData.get('expiresAt') as string;
            const payload = {
                targetType,
                targetId: formData.get('targetId') as string,
                r2Key: formData.get('r2Key') as string,
                grantedBy: formData.get('grantedBy') as string,
                internalNotes: formData.get('internalNotes') as string,
                expiresAt: expiresAtValue ? new Date(expiresAtValue) : undefined
            };

            if (initialData?.id) {
                await updateVerification(initialData.id, payload as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
                alert('Verification Updated!');
            } else {
                await createVerification(payload as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
                alert('Verification Issued!');
            }

            router.refresh();
            if (initialData?.id) router.push('/verifications');
        } catch (e) {
            console.error(e);
            alert(`Failed to ${initialData?.id ? 'update' : 'issue'} verification`);
        } finally {
            setIsSubmitting(false);
        }
    }

    const currentOptions = targetType === 'artifact' ? artifacts : entities;

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setTargetType('artifact')}
                        className={`py-2 text-[10px] font-black uppercase border transition-all ${targetType === 'artifact' ? 'bg-blue-600 border-blue-500 text-black' : 'bg-zinc-950 border-zinc-900 text-zinc-500'}`}
                    >
                        Artifact
                    </button>
                    <button
                        type="button"
                        onClick={() => setTargetType('entity')}
                        className={`py-2 text-[10px] font-black uppercase border transition-all ${targetType === 'entity' ? 'bg-blue-600 border-blue-500 text-black' : 'bg-zinc-950 border-zinc-900 text-zinc-500'}`}
                    >
                        Entity
                    </button>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Target_Identity</label>
                    <select
                        name="targetId"
                        defaultValue={initialData?.targetId}
                        required
                        className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:border-blue-600 outline-none"
                    >
                        <option value="">Select Target...</option>
                        {currentOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">R2_Proof_Manifest (Key)</label>
                    <input
                        name="r2Key"
                        defaultValue={initialData?.r2Key}
                        required
                        className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:border-blue-600 outline-none transition-colors"
                        placeholder="contracts/2026/001_proof.pdf"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-zinc-400">Authorized_By</label>
                        <input
                            name="grantedBy"
                            defaultValue={defaultAuthorizedBy}
                            required
                            className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:border-blue-600 outline-none"
                            placeholder="Architect_Oversight"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-zinc-400">Expiry_Date (Optional)</label>
                        <input
                            name="expiresAt"
                            type="date"
                            defaultValue={initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : ''}
                            className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:border-blue-600 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Internal_Notes</label>
                    <textarea
                        name="internalNotes"
                        defaultValue={initialData?.internalNotes}
                        rows={3}
                        className="w-full bg-black border border-zinc-800 p-3 text-sm text-white focus:border-blue-600 outline-none resize-none transition-colors"
                        placeholder="Verified via official documentation provided on..."
                    />
                </div>
            </div>

            <button
                disabled={isSubmitting}
                type="submit"
                className="w-full py-4 bg-blue-600 text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50"
            >
                {isSubmitting ? 'ENCRYPTING...' : initialData?.id ? 'UPDATE_ENTRY' : 'GRANT_VERIFICATION'}
            </button>
        </form>
    );
}
