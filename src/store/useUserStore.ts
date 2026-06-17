import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: (user, token) => {
        set({ user, token, isLoggedIn: true })
      },

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false })
      },

      setUser: (user) => {
        set({ user })
      },

      setToken: (token) => {
        set({ token })
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)

export default useUserStore
