import { create } from 'zustand'
import type { Alert, AlertLevel } from '../types'

interface AlertState {
  alerts: Alert[]
  unreadCount: number
  addAlert: (alert: Alert) => void
  upgradeAlert: (alertId: string, newLevel: AlertLevel, upgradeReason?: string) => void
  markAsRead: (alertId: string) => void
  markAllAsRead: () => void
  removeAlert: (alertId: string) => void
  setAlerts: (alerts: Alert[]) => void
  clearAlerts: () => void
}

const useAlertStore = create<AlertState>()((set, get) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    }))
  },

  upgradeAlert: (alertId, newLevel, upgradeReason) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              level: newLevel,
              upgradedAt: new Date().toISOString(),
              upgradeReason: upgradeReason || alert.upgradeReason,
            }
          : alert
      ),
    }))
  },

  markAsRead: (alertId) => {
    set((state) => {
      const alert = state.alerts.find((a) => a.id === alertId)
      const wasUnread = alert && !alert.isRead
      return {
        alerts: state.alerts.map((a) =>
          a.id === alertId ? { ...a, isRead: true, readAt: new Date().toISOString() } : a
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    })
  },

  markAllAsRead: () => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.isRead ? alert : { ...alert, isRead: true, readAt: new Date().toISOString() }
      ),
      unreadCount: 0,
    }))
  },

  removeAlert: (alertId) => {
    set((state) => {
      const alert = state.alerts.find((a) => a.id === alertId)
      const wasUnread = alert && !alert.isRead
      return {
        alerts: state.alerts.filter((a) => a.id !== alertId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    })
  },

  setAlerts: (alerts) => {
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.isRead).length,
    })
  },

  clearAlerts: () => {
    set({ alerts: [], unreadCount: 0 })
  },
}))

export default useAlertStore
