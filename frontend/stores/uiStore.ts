"use client";

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  loading: boolean;
  message: string | null;
  messageType: "success" | "error" | null;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  showMessage: (message: string, type: "success" | "error") => void;
  clearMessage: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  loading: false,
  message: null,
  messageType: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLoading: (loading) => set({ loading }),
  showMessage: (message, type) => set({ message, messageType: type }),
  clearMessage: () => set({ message: null, messageType: null }),
}));
