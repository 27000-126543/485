import { create } from 'zustand';
import type { UserRole, User as BaseUser } from '@/types';
import { getRoleDisplayName } from '@/utils/permissions';

export type { UserRole };

export interface User extends Omit<BaseUser, 'blockId'> {
  role: UserRole;
  avatar: string;
  block: string;
}

interface UserStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setBlock: (block: string) => void;
}

export const getRoleName = (role: UserRole): string => getRoleDisplayName(role);

const getInitialState = () => {
  try {
    const savedUser = localStorage.getItem('oilfield_user');
    const savedToken = localStorage.getItem('oilfield_token');
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      token: savedToken,
    };
  } catch {
    return { user: null, token: null };
  }
};

export const useUserStore = create<UserStore>((set) => ({
  ...getInitialState(),
  login: (user, token) => {
    localStorage.setItem('oilfield_user', JSON.stringify(user));
    localStorage.setItem('oilfield_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('oilfield_user');
    localStorage.removeItem('oilfield_token');
    set({ user: null, token: null });
  },
  setBlock: (block) =>
    set((state) => {
      if (state.user) {
        const updatedUser = { ...state.user, block };
        localStorage.setItem('oilfield_user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      }
      return state;
    }),
}));
