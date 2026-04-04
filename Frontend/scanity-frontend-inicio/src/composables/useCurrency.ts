/**
 * Composable para formatação de moeda em Português do Brasil
 */
export function useCurrency() {
  /**
   * Formata um valor numérico para o formato de moeda em R$ (Reais)
   * @param value Valor a ser formatado
   * @param options Opções de formatação
   * @returns String formatada no padrão de moeda brasileira
   */
  function formatCurrency(
    value: number | string | null | undefined,
    options: Intl.NumberFormatOptions = {},
  ): string {
    if (value === null || value === undefined || value === '') {
      return 'R$ 0,00';
    }

    // Converter para número se for string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Verificar se é um número válido
    if (isNaN(numericValue)) {
      return 'R$ 0,00';
    }

    // Opções padrão de formatação de moeda brasileira
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    // Mesclar opções padrão com as opções fornecidas
    const formatterOptions = { ...defaultOptions, ...options };

    // Usar o Intl.NumberFormat para formatar o valor
    return new Intl.NumberFormat('pt-BR', formatterOptions).format(numericValue);
  }

  /**
   * Converte uma string formatada em moeda brasileira (R$) para um valor numérico
   * @param formattedValue String formatada no padrão de moeda brasileira
   * @returns Valor numérico (float)
   */
  function parseCurrency(formattedValue: string | null | undefined): number {
    if (!formattedValue) {
      return 0;
    }

    // Remove símbolos de moeda, pontos de milhar e substitui vírgula por ponto
    const cleanValue = formattedValue
      .replace(/R\$\s?/g, '') // Remove 'R$' e espaço opcional
      .replace(/\./g, '') // Remove pontos de milhar
      .replace(/,/g, '.') // Substitui vírgula por ponto
      .trim(); // Remove espaços extras

    // Converte para número
    const numericValue = parseFloat(cleanValue);

    // Retorna 0 se não for um número válido
    return isNaN(numericValue) ? 0 : numericValue;
  }

  return {
    formatCurrency,
    parseCurrency,
  };
}
