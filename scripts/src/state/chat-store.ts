import { create } from "zustand";




interface ChatUIState {
  activeInbox: boolean;
  activeProfileView: boolean;
  setActiveInbox: (v: boolean) => void;
  setActiveProfileView: (v: boolean) => void;
}

export const useChatStore = create<ChatUIState>((set) => ({
  activeInbox: false,
  activeProfileView: false,
  setActiveInbox: (activeInbox) => set({ activeInbox }),
  setActiveProfileView: (activeProfileView) => set({ activeProfileView }),
}));
