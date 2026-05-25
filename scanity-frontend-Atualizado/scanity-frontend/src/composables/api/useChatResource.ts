import { API_URI, api } from 'src/boot/axios';

export interface ChatHistoryMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  account_id: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  data: ChatHistoryMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function useChatResource() {
  function sendMessage(
    message: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
  ): () => void {
    const token = localStorage.getItem('token');
    const controller = new AbortController();

    const url = `${API_URI}/chat`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          let errorMsg = 'Erro ao comunicar com o servidor.';

          try {
            const json = JSON.parse(text);
            errorMsg = json.message || errorMsg;
          } catch {
            // mantém mensagem padrão
          }

          throw new Error(errorMsg);
        }

        if (!response.body) {
          throw new Error('Resposta sem corpo de stream.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const payload = trimmed.slice(6);

            if (payload === '[DONE]') {
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(payload);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              // ignora chunks inválidos
            }
          }
        }

        onDone();
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        onError(error.message || 'Erro inesperado.');
      });

    return () => controller.abort();
  }

  async function loadHistory(
    page = 1,
    limit = 10,
  ): Promise<ChatHistoryResponse> {
    const { data } = await api.get<ChatHistoryResponse>('/chat/history', {
      params: { page, limit },
    });
    return data;
  }

  async function clearHistory(): Promise<void> {
    await api.delete('/chat/history');
  }

  return { sendMessage, loadHistory, clearHistory };
}
