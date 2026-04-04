export function useString() {
  /**
   * Obtém as iniciais de um nome
   * @param name - Nome completo
   * @returns Iniciais do nome em maiúsculas (primeira e última palavra) ou '?' se inválido
   * @example
   * getInitials('João Silva') // 'JS'
   * getInitials('Maria') // 'MA'
   * getInitials('') // '?'
   */
  function getInitials(name: string): string {
    if (!name) return '?';
    const words = name
      .trim()
      .split(' ')
      .filter((w) => w.length > 0);
    if (words.length === 0) return '?';
    if (words.length === 1 && words[0]) {
      return words[0].substring(0, 2).toUpperCase();
    }
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    if (firstWord && lastWord && firstWord[0] && lastWord[0]) {
      return (firstWord[0] + lastWord[0]).toUpperCase();
    }
    return '?';
  }

  /**
   * Capitaliza a primeira letra de uma string
   * @param text - Texto a ser capitalizado
   * @returns Texto com primeira letra maiúscula
   * @example
   * capitalize('joão') // 'João'
   */
  function capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Capitaliza a primeira letra de cada palavra
   * @param text - Texto a ser capitalizado
   * @returns Texto com primeira letra de cada palavra maiúscula
   * @example
   * capitalizeWords('joão da silva') // 'João Da Silva'
   */
  function capitalizeWords(text: string): string {
    if (!text) return '';
    return text
      .split(' ')
      .map((word) => capitalize(word))
      .join(' ');
  }

  /**
   * Trunca um texto com reticências
   * @param text - Texto a ser truncado
   * @param maxLength - Comprimento máximo
   * @returns Texto truncado com '...' se necessário
   * @example
   * truncate('Texto muito longo', 10) // 'Texto m...'
   */
  function truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Remove acentos de uma string
   * @param text - Texto com acentos
   * @returns Texto sem acentos
   * @example
   * removeAccents('José') // 'Jose'
   */
  function removeAccents(text: string): string {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Gera um slug a partir de um texto
   * @param text - Texto a ser convertido
   * @returns Slug (lowercase, sem acentos, com hífens)
   * @example
   * slugify('Olá Mundo!') // 'ola-mundo'
   */
  function slugify(text: string): string {
    if (!text) return '';
    return removeAccents(text)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return {
    getInitials,
    capitalize,
    capitalizeWords,
    truncate,
    removeAccents,
    slugify,
  };
}
