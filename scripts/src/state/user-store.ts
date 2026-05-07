import { create } from "zustand";

export type ActiveTab = "home" | "raffle" | "settings";

interface UserStoreState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const useUserStore = create<UserStoreState>((set) => ({
  activeTab: "home",
  setActiveTab: (activeTab) => set({ activeTab }),
}));

export default useUserStore;
