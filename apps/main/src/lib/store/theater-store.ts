import { create } from 'zustand';

export interface TheaterVideo {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
    platform: 'youtube' | 'bilibili' | 'niconico' | 'local' | 'unknown';
}

interface TheaterState {
    activeVideo: TheaterVideo | null;
    setActiveVideo: (video: TheaterVideo) => void;
}

export const useTheaterStore = create<TheaterState>((set) => ({
    activeVideo: null,
    setActiveVideo: (video) => set({ activeVideo: video }),
}));
