import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([]);
  let counter = 0;

  function notify(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++counter;
    toasts.value.push({ id, type, message });
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }

  const success = (message: string, duration?: number) => notify(message, 'success', duration);
  const error = (message: string, duration?: number) => notify(message, 'error', duration);
  const info = (message: string, duration?: number) => notify(message, 'info', duration);
  const warning = (message: string, duration?: number) => notify(message, 'info', duration);

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, notify, success, error, info, warning, dismiss };
});
