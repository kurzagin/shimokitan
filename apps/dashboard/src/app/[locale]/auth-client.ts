
"use client"

export const authClient = {
    signIn: {
        email: async () => ({ data: null, error: null }),
        social: async () => ({ data: null, error: null })
    },
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { user: { name: 'Local Architect', id: 'local' } }, error: null })
} as any;
