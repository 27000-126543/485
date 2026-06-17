import { create } from 'zustand'
import type { Alert } from '../types'

interface AppState {
  currentBlockId: string | null
  globalAlertList: Alert[]
  setCurrentBlockId: (blockId: string | null) => void
  addGlobalAlert: (alert: Alert) => void
  removeGlobalAlert: (alertId: string) => void
  setGlobalAlertList: (alerts: Alert[]) => void
  clearGlobalAlerts: () => void
}

const useAppStore = create<AppState>()((set) => ({
  currentBlockId: null,
  globalAlertList: [],

  setCurrentBlockId: (blockId) => {
    set({ currentBlockId: blockId })
  },

  addGlobalAlert: (alert) => {
    set((state) => ({
      globalAlertList: [alert, ...state.globalAlertList],
    }))
  },

  removeGlobalAlert: (alertId) => {
    set((state) => ({
      globalAlertList: state.globalAlertList.filter(
        (alert) => alert.id !== alertId
      ),
    }))
  },

  setGlobalAlertList: (alerts) => {
    set({ globalAlertList: alerts })
  },

  clearGlobalAlerts: () => {
    set({ globalAlertList: [] })
  },
}))

export default useAppStore
