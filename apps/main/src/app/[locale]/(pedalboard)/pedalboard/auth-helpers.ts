
import { getDb, schema, eq } from '@shimokitan/db';
import { auth } from '@shimokitan/auth';

// --- AUTH HELPERS ---

export async function getSession() {
    return auth.getSession();
}

export async function requireUser() {
    const user = await ensureUserSync();
    if (!user) throw new Error('Unauthorized_Signal: Identity_Lost');
    return user;
}

export async function requireArchitect() {
    const user = await requireUser();
    if (user.role !== 'architect' && user.role !== 'founder') {
        throw new Error('Forbidden_Signal: Architects_Only');
    }
    return user;
}

export async function requireFounder() {
    const user = await requireUser();
    if (user.role !== 'founder') {
        throw new Error('Forbidden_Signal: Founders_Only');
    }
    return user;
}

// --- AUTH & RBAC ---

export async function ensureUserSync() {
    let session;
    try {
        const result = await auth.getSession();
        session = result.data;
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error("Auth Session Error in ensureUserSync:", e);
        return null;
    }

    if (!session?.user) return null;

    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name;
    const userImage = session.user.image;

    try {
        // 1. Try to find the user by ID first (Fast Path)
        const existingById = await db.query.users.findFirst({
            where: (u: any, { eq }: any) => eq(u.id, userId)
        });

        if (existingById) {
            const updateObj: any = {};
            if (existingById.email !== userEmail) updateObj.email = userEmail;
            if (!existingById.name && userName) updateObj.name = userName;
            if (existingById.image !== userImage && userImage) updateObj.image = userImage;
            if (existingById.emailVerified !== (session.user as any).emailVerified) updateObj.emailVerified = (session.user as any).emailVerified;

            if (Object.keys(updateObj).length > 0) {
                updateObj.updatedAt = new Date();
                await db.update(schema.users)
                    .set(updateObj)
                    .where(eq(schema.users.id, userId));
            }

            return { 
                ...session.user, 
                email: userEmail, 
                role: existingById.role, 
                resonanceMultiplier: Number(existingById.resonanceMultiplier),
                image: existingById.image,
                emailVerified: existingById.emailVerified
            };
        }

        // 2. If not found by ID, try to find by Email
        const existingByEmail = await db.query.users.findFirst({
            where: (u: any, { eq }: any) => eq(u.email, userEmail)
        });

        if (existingByEmail) {
            await db.update(schema.users)
                .set({
                    id: userId,
                    name: existingByEmail.name || userName,
                    image: existingByEmail.image || userImage,
                    emailVerified: (session.user as any).emailVerified || existingByEmail.emailVerified,
                    updatedAt: new Date()
                })
                .where(eq(schema.users.email, userEmail));

            return { 
                ...session.user, 
                email: userEmail, 
                role: existingByEmail.role, 
                resonanceMultiplier: Number(existingByEmail.resonanceMultiplier),
                image: existingByEmail.image || userImage,
                emailVerified: (session.user as any).emailVerified || existingByEmail.emailVerified
            };
        }

        // 3. Create new user
        const newUser = {
            id: userId,
            email: userEmail,
            name: userName,
            image: userImage,
            emailVerified: (session.user as any).emailVerified || false,
            role: 'resident' as const,
        };
        await db.insert(schema.users).values(newUser);

        return { 
            ...session.user, 
            email: userEmail, 
            role: 'resident', 
            resonanceMultiplier: 100,
            image: userImage,
            emailVerified: (session.user as any).emailVerified || false
        };

    } catch (error: any) {
        if (error.code === '23505') {
            const racingUser = await db.query.users.findFirst({
                where: (u: any, { or, eq }: any) => or(eq(u.id, userId), eq(u.email, userEmail))
            });
            if (racingUser) return { ...session.user, email: userEmail, role: racingUser.role, resonanceMultiplier: racingUser.resonanceMultiplier };
        }
        if (process.env.NODE_ENV !== 'production') console.error('User_Sync_Critical_Failure:', error);
        throw new Error('Identity_Establishment_Failed');
    }
}
