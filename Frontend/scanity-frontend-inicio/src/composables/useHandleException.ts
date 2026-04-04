import { Notify } from 'quasar';

export function useHandleException() {
  function showError(errorCaught: any) {
    console.log(errorCaught);

    // Se for uma string simples
    if (typeof errorCaught === 'string') {
      console.log('if1');
      Notify.create({
        message: errorCaught,
        icon: 'error',
        position: 'top-right',
        color: 'red',
        actions: [{ icon: 'close', color: 'white' }],
      });
      return;
    }

    // Se tiver responseData com mensagem em formato array
    if (errorCaught?.response?.data?.message && Array.isArray(errorCaught.response.data.message)) {
      console.log('if2');
      const messageArray = errorCaught.response.data.message;
      // Exibe cada mensagem do array em uma linha
      const formattedMessage = messageArray.join('<br>');

      Notify.create({
        message: formattedMessage,
        html: true,
        icon: 'error',
        position: 'top-right',
        color: 'red',
        actions: [{ icon: 'close', color: 'white' }],
      });
      return;
    }

    // Se tiver responseData com mensagem string
    if (errorCaught?.response?.data?.message) {
      console.log('if3');
      let message = errorCaught.response.data.message;
      if (message.includes('Unauthorized')) {
        message = 'Acesso não autorizado';
      }
      Notify.create({
        message,
        html: true,
        icon: 'error',
        position: 'top-right',
        color: 'red',
        actions: [{ icon: 'close', color: 'white' }],
      });
      return;
    }

    // Fallback para outros tipos de erros
    Notify.create({
      message: errorCaught.message || 'Um erro inesperado aconteceu',
      icon: 'error',
      position: 'top-right',
      color: 'red',
      actions: [{ icon: 'close', color: 'white' }],
    });
  }

  return {
    showError,
  };
}
