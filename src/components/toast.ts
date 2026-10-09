import { createContext, useContext } from 'react'

export type ToastKind = 'success' | 'info' | 'error'
export interface Toast { id: number; kind: ToastKind; text: string }

export const ToastContext = createContext<(kind: ToastKind, text: string) => void>(() => {})

/** toast('success', 'Account opened'): a short message that hides itself after a few seconds. */
export const useToast = () => useContext(ToastContext)
