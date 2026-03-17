import { getDb } from '@shimokitan/db';

export async function getSession() {
    return { data: null };
}

export async function requireUser() {
    const user = await ensureUserSync();
    if (!user) throw new Error('Unauthorized_Signal: Identity_Lost');
    return user;
}

export async function ensureUserSync() {
    // Local-only dashboard bypass
    return {
        id: 'local-architect',
        email: 'local@shimokitan.live',
        name: 'Local Architect',
        role: 'founder',
        resonanceMultiplier: 100
    };
}

export async function requireArchitect() {
    const user = await requireUser();
    if (user.role !== 'founder' && user.role !== 'architect') throw new Error('Insufficient_Privileges // Sector_Architects_Only');
    return user;
}

export async function requireFounder() {
    const user = await requireUser();
    if (user.role !== 'founder') throw new Error('Insufficient_Privileges // Sector_Founders_Only');
    return user;
}
