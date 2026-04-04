/**
 * Composable para gerar e imprimir código de barras de produto (visualização em QR).
 * Usa a biblioteca `qrcode` para gerar a imagem e abre nova janela para impressão.
 */

import QRCode from 'qrcode';

export interface BarcodePrintProps {
  title?: string | null | undefined;
  barcode?: string | null | undefined;
}

export interface UseBarcodePrintOptions {
  /** Título exibido no topo do documento impresso */
  title?: string;
  /** Formato do código de barras: CODE128 (padrão), EAN13, CODE39, etc. */
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
  /** Largura da barra em px */
  width?: number;
  /** Altura da barra em px — também define o tamanho (lado) do QR em px */
  height?: number;
  /** Exibir o valor abaixo do código */
  displayValue?: boolean;
}

const DEFAULT_OPTIONS: UseBarcodePrintOptions = {
  title: 'Código de Barras',
  format: 'CODE128',
  width: 2,
  height: 80,
  displayValue: true,
};

/**
 * Gera a imagem do QR (conteúdo = valor do campo barcode) em base64 (data URL).
 */
async function generateBarcodeDataUrl(
  barcode: string,
  options: Pick<UseBarcodePrintOptions, 'format' | 'width' | 'height' | 'displayValue'>,
): Promise<string> {
  const base = options.height ?? 80;
  const side = Math.max(Math.round(base * 2), 128);
  return QRCode.toDataURL(barcode, {
    width: side,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

/**
 * Abre janela de impressão com o código e dados do produto.
 */
function openPrintWindow(
  props: BarcodePrintProps,
  barcodeDataUrl: string,
  displayValue: boolean,
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('useBarcodePrint: pop-up bloqueada. Permita pop-ups para imprimir.');
    return;
  }

  const { title, barcode } = props;

  const doc = printWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 24px;
            color: #333;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            margin: 0;
          }
          .print-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
            max-width: 300px;
            word-break: break-word;
          }
          .barcode-wrapper {
            margin: 16px 0;
            padding: 16px;
            border: 1px solid #eee;
            border-radius: 8px;
            background: #fff;
          }
          .barcode-wrapper img {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
          }
          .barcode-value {
            font-size: 12px;
            text-align: center;
            margin-top: 8px;
            letter-spacing: 1px;
          }
          @media print {
            body { padding: 12px; }
            .barcode-wrapper { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-title">${escapeHtml(title ?? '')}</div>
        <div class="barcode-wrapper">
          <img src="${barcodeDataUrl}" alt="Código QR ${escapeHtml(barcode ?? '')}" />
          ${displayValue ? `<div class="barcode-value">${escapeHtml(barcode ?? '')}</div>` : ''}
        </div>
        <script>
          window.addEventListener('afterprint', function() { window.close(); });
          window.onfocus = function() { setTimeout(function() { window.print(); }, 250); };
          setTimeout(function() { window.print(); }, 300);
        </script>
      </body>
    </html>`);
  doc.close();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const DOWNLOAD_QR_PNG_SIZE = 500;

function sanitizeDownloadBaseName(name: string): string {
  const trimmed = name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return trimmed.slice(0, 80) || 'produto';
}

export function useBarcodePrint(options: UseBarcodePrintOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  /**
   * Imprime o código de barras do produto.
   * @param props - Objeto com name e barcode (ex.: produto da API)
   */
  async function printBarcode(props: BarcodePrintProps): Promise<void> {
    const barcodeValue = (props.barcode ?? '').toString().trim();
    if (!barcodeValue) {
      console.warn('useBarcodePrint: produto sem código de barras.');
      return;
    }

    const barcodeDataUrl = await generateBarcodeDataUrl(barcodeValue, opts);
    openPrintWindow(props, barcodeDataUrl, opts.displayValue ?? true);
  }

  /**
   * Gera a imagem do QR como data URL para exibição em tela.
   */
  async function generateBarcodeDataUrlFromProps(props: BarcodePrintProps): Promise<string | null> {
    const barcodeValue = (props.barcode ?? '').toString().trim();
    if (!barcodeValue) {
      console.warn('useBarcodePrint: produto sem código de barras.');
      return null;
    }

    return generateBarcodeDataUrl(barcodeValue, opts);
  }

  /**
   * Baixa o QR do produto como PNG (tamanho fixo 500×500 px).
   */
  async function downloadBarcodePng(props: BarcodePrintProps): Promise<void> {
    const barcodeValue = (props.barcode ?? '').toString().trim();
    if (!barcodeValue) {
      console.warn('useBarcodePrint: produto sem código de barras.');
      return;
    }

    const dataUrl = await QRCode.toDataURL(barcodeValue, {
      width: DOWNLOAD_QR_PNG_SIZE,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    });

    const base = sanitizeDownloadBaseName(String(props.title ?? ''));
    const filename = `${base}-qrcode.png`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    printBarcode,
    generateBarcodeDataUrl,
    generateBarcodeDataUrlFromProps,
    downloadBarcodePng,
  };
}
