/**
 * Composable para impressão de conteúdo usando Paged.js.
 * Abre uma nova janela com o conteúdo, aplica Paged.js (quando disponível) e dispara a impressão.
 */

export interface UsePagedPrintOptions {
  /** Título exibido no topo do documento impresso */
  title?: string;
  /** Usar Paged.js para paginação (default: true). Se false ou falha ao carregar, imprime sem Paged.js */
  usePagedJs?: boolean;
}

const PAGED_POLYFILL_URL = 'https://unpkg.com/pagedjs@0.6.0/dist/paged.polyfill.js';

export function usePagedPrint(options: UsePagedPrintOptions = {}) {
  const { title = 'Relatório', usePagedJs = true } = options;

  /**
   * Imprime o conteúdo desejado.
   * @param content - Elemento DOM ou string HTML a ser impresso
   */
  function print(content: HTMLElement | string): void {
    const htmlContent = typeof content === 'string' ? content : content.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.warn('usePagedPrint: pop-up bloqueada. Permita pop-ups para imprimir.');
      return;
    }

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 16px; color: #333; }
            .print-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="print-title">${title}</div>
          <div id="print-content">${htmlContent}</div>
          ${usePagedJs ? `<script src="${PAGED_POLYFILL_URL}"></script>` : ''}
          <script>
            (function() {
              if (typeof window.PagedPolyfill !== 'undefined') {
                window.addEventListener('afterprint', function() { window.close(); });
                window.onfocus = function() { setTimeout(function() { window.print(); }, 250); };
                setTimeout(function() { window.print(); }, 300);
              } else {
                window.addEventListener('afterprint', function() { window.close(); });
                window.onfocus = function() { setTimeout(function() { window.print(); }, 250); };
                setTimeout(function() { window.print(); }, 300);
              }
            })();
          </script>
        </body>
      </html>`);
    doc.close();
  }

  return { print };
}
