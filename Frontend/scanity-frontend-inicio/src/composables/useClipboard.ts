import { Notify } from 'quasar';

export function useClipboard() {
  async function copyToClipboard(text?: string, successMessage?: string) {
    if (!text) {
      return;
    }

    const blob = new Blob([text], {
      type: 'text/plain',
    });
    const data = [new ClipboardItem({ 'text/plain': blob })];

    try {
      await navigator.clipboard.write(data);
      Notify.create({
        message: successMessage ?? 'Copiado para a área de transferência!',
        html: true,
        icon: 'done',
        position: 'bottom',
        color: 'green',
      });
    } catch (error) {
      console.log(error);
      Notify.create({
        message: 'Error ao copiar o texto',
        html: true,
        icon: 'error',
        position: 'top-right',
        color: 'red',
      });
    }
  }
  return { copyToClipboard };
}
