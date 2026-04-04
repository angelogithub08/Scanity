import { isString } from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export function useDate() {
  /**
   * Cria um objeto dayjs tratando corretamente datas com timezone UTC
   *
   * Esta função resolve o problema de interpretação incorreta de datas UTC
   * onde "2025-03-13T00:00:00.000Z" poderia ser exibido como "12/03/2025"
   * devido à conversão de timezone.
   *
   * @param strDate String da data
   * @returns Objeto dayjs configurado corretamente
   */
  function createDayjsObject(strDate: string) {
    // Se a string contém informação de timezone (Z ou +/-), trata como UTC
    if (
      strDate.includes('T') &&
      (strDate.includes('Z') || strDate.includes('+') || strDate.match(/-\d{2}:\d{2}$/))
    ) {
      return dayjs.utc(strDate);
    }
    // Caso contrário, trata como timezone local
    return dayjs(strDate);
  }

  function dateToClient(strDate: string) {
    if (isString(strDate) && dayjs(strDate).isValid()) {
      return createDayjsObject(strDate).format('DD/MM/YYYY');
    }

    return null;
  }

  function dateToDatabase(strDate: string) {
    if (isString(strDate) && dayjs(strDate, 'DD/MM/YYYY').isValid()) {
      return dayjs(strDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
    }

    return null;
  }

  function datetimeToClient(strDate: string) {
    if (isString(strDate) && dayjs(strDate).isValid()) {
      return dayjs(strDate).format('DD/MM/YYYY HH:mm');
    }

    return null;
  }

  function datetimeToDatabase(strDate: string) {
    if (isString(strDate) && dayjs(strDate, 'DD/MM/YYYY HH:mm').isValid()) {
      return dayjs(strDate, 'DD/MM/YYYY HH:mm').format();
    }

    return null;
  }

  function getTime(strDate: string) {
    if (!isString(strDate) && !dayjs(strDate).isValid()) return null;

    const dateObj = createDayjsObject(strDate);
    const previousDayDate = dayjs().diff(dateObj, 'day');
    if (previousDayDate) return dateObj.format('DD/MM/YYYY HH:mm');
    return dateObj.format('HH:mm');
  }

  function getHours(value: string) {
    return createDayjsObject(value).format('HH:mm');
  }

  /**
   * Verifica se uma string é uma data válida no formato DD/MM/YYYY
   * @param strDate String contendo a data a ser verificada
   * @returns boolean indicando se é uma data válida
   */
  function isValidDate(strDate: string | null): boolean {
    if (!isString(strDate)) return false;

    // Verifica se a string corresponde ao formato DD/MM/YYYY
    const formatRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!formatRegex.test(strDate)) return false;

    // Verifica se é uma data válida usando dayjs
    return dayjs(strDate, 'DD/MM/YYYY').isValid();
  }

  /**
   * Verifica se uma string é um datetime válido no formato DD/MM/YYYY HH:mm
   * @param strDatetime String contendo o datetime a ser verificado
   * @returns boolean indicando se é um datetime válido
   */
  function isValidDatetime(strDatetime: string | null): boolean {
    if (!isString(strDatetime)) return false;

    // Verifica se a string corresponde ao formato DD/MM/YYYY HH:mm
    const formatRegex = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/;
    if (!formatRegex.test(strDatetime)) return false;

    // Verifica se é um datetime válido usando dayjs
    return dayjs(strDatetime, 'DD/MM/YYYY HH:mm').isValid();
  }

  return {
    dateToClient,
    dateToDatabase,
    datetimeToClient,
    datetimeToDatabase,
    getTime,
    getHours,
    isValidDate,
    isValidDatetime,
  };
}
