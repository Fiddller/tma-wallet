import { create } from 'zustand';

type ModalType = 'send' | 'receive' | 'withdraw' | 'exchange' | null;

interface ModalState {
  activeModal: ModalType;
  openModal: (modal: NonNullable<ModalType>) => void;
  closeModal: () => void;
}

interface AppStore extends ModalState {
  isConnected: boolean;
  balance: number;
  address: string;
  setBalance: (balance: number) => void;
  setIsConnected: (status: boolean) => void;
  setAddress: (address: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeModal: null,
  isConnected: false,
  balance: 0,
  address: '',

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setBalance: (balance) => set({ balance }),
  setIsConnected: (status) => set({ isConnected: status }),
  setAddress: (address) => set({ address }),
}));
