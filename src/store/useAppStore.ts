import { create } from 'zustand';

type ModalType = 'send' | 'receive' | 'withdraw' | 'exchange' | 'mint' | null;

interface ModalState {
  activeModal: ModalType;
  openModal: (modal: NonNullable<ModalType>) => void;
  closeModal: () => void;
}

interface AppStore extends ModalState {
  isConnected: boolean;
  walletRestored: boolean;  // true после tonConnectUI.connectionRestored
  balance: number;      // TestJetton баланс
  tonBalance: number;   // нативный TON баланс
  address: string;
  pendingSendAddress: string;  // адрес для автозаполнения SendModal из диплинка
  setBalance: (balance: number) => void;
  setTonBalance: (balance: number) => void;
  setIsConnected: (status: boolean) => void;
  setWalletRestored: (restored: boolean) => void;
  setAddress: (address: string) => void;
  setPendingSendAddress: (address: string) => void;
  clearPendingSendAddress: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeModal: null,
  isConnected: false,
  walletRestored: false,
  balance: 0,
  tonBalance: 0,
  address: '',
  pendingSendAddress: '',

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setBalance: (balance) => set({ balance }),
  setTonBalance: (tonBalance) => set({ tonBalance }),
  setIsConnected: (status) => set({ isConnected: status }),
  setWalletRestored: (restored) => set({ walletRestored: restored }),
  setAddress: (address) => set({ address }),
  setPendingSendAddress: (pendingSendAddress) => set({ pendingSendAddress }),
  clearPendingSendAddress: () => set({ pendingSendAddress: '' }),
}));
