/**
 * @file store.js
 * @description Global UI/data state for the dashboard.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system', // 'light' | 'dark' | 'system'
      setTheme: (theme) => set({ theme }),

      // Current loaded snapshot
      snapshot: null,
      setSnapshot: (snapshot) => set({ snapshot }),

      // History (loaded from IndexedDB)
      snapshots: [],
      setSnapshots: (snapshots) => set({ snapshots }),

      // Filters
      selectedFiles: [], // array of File# strings
      setSelectedFiles: (files) => set({ selectedFiles: files }),
      selectedColors: [],
      setSelectedColors: (colors) => set({ selectedColors: colors }),
      selectedSizes: [],
      setSelectedSizes: (sizes) => set({ selectedSizes: sizes }),
      mode: 'cum', // 'cum' | 'sel' (Minggu Ini)
      setMode: (mode) => set({ mode }),
      range: 'all', // 'all' | 'week' | 'month' | 'custom'
      setRange: (range) => set({ range }),

      // Upload state
      uploading: false,
      setUploading: (v) => set({ uploading: v }),
      uploadError: null,
      setUploadError: (e) => set({ uploadError: e }),

      // Validation warnings from last upload
      warnings: [],
      setWarnings: (w) => set({ warnings: w }),
    }),
    {
      name: 'garmen-ui',
      partialize: (s) => ({ theme: s.theme, selectedFiles: s.selectedFiles, mode: s.mode }),
    }
  )
)
