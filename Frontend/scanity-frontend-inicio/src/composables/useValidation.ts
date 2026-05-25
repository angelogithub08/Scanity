import dayjs from 'dayjs';
import { trim, isString, toLower, isNil, isEmpty } from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export function useValidation() {
  function required(val: string) {
    if (trim(val) == '' || val == null) {
      return 'Campo obrigatório';
    }

    return true;
  }

  function requiredNumber(val: string) {
    if (trim(val) == '' || val == null) {
      return 'Campo obrigatório';
    }

    const num = Number(val);

    if (Number.isNaN(num)) {
      return 'Digite um valor válido';
    }

    if (num <= 0) {
      return 'Digite um valor maior que 0';
    }

    return true;
  }

  function requiredPrice(val: string) {
    const invalidMessage = required(val);

    if (invalidMessage !== true) {
      return invalidMessage;
    }

    const price = Number(val?.replace(',', '.'));

    if (Number.isNaN(price) || price <= 0) {
      return 'Digite um valor válido';
    }

    return true;
  }

  function isValidTime(val: string) {
    const time = Number(val);

    if (Number.isNaN(time) || time <= 0) {
      return 'Digite um tempo válido';
    }

    return true;
  }

  function isValidPhone(val: string) {
    if (isNil(val) || isEmpty(val)) return true;

    const regex = /^(\(?\d{2,3}\)?[-.\s]?)?(?:9\d{4})([-.\s]?\d{4})$/;
    if (!regex.test(val)) return 'Telefone inválido';
    return true;
  }

  function isValidEmail(val: string) {
    if (isNil(val) || isEmpty(val)) return true;

    const reg =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!reg.test(toLower(val))) {
      return 'E-mail inválido';
    }

    return true;
  }

  function min6(val: string) {
    if (isString(val) && val.length < 6) {
      return 'No mínimo 6 caracteres';
    }

    return true;
  }

  function min11Numbers(val: string) {
    const justNumbers = val.replace(/[^\d.-]+/g, '');

    if (justNumbers.length === 0) {
      return true;
    }

    if (justNumbers.length < 11) {
      return 'No mínimo 11 caracteres';
    }

    return true;
  }

  function cpfIsValid(cpf: string) {
    if (!cpf) return true;

    const clearedCpf = cpf.replace(/\D/g, '');
    if (clearedCpf.length === 0) return true;
    if (clearedCpf.length !== 11) return false;

    const firstNineDigits = clearedCpf.slice(0, 9);
    const firstVerifierDigit = Number(clearedCpf.charAt(9));
    const secondVerifierDigit = Number(clearedCpf.charAt(10));

    const firstDigitSum = firstNineDigits
      .split('')
      .map((digit, index) => Number(digit) * (10 - index))
      .reduce((acc, curr) => acc + curr);

    const firstDigit = (firstDigitSum * 10) % 11;

    const secondDigitSum = firstNineDigits
      .concat(firstDigit.toString())
      .split('')
      .map((digit, index) => Number(digit) * (11 - index))
      .reduce((acc, curr) => acc + curr);

    const secondDigit = (secondDigitSum * 10) % 11;

    if (firstDigit === firstVerifierDigit && secondDigit === secondVerifierDigit) {
      return true;
    }

    return 'CPF inválido';
  }

  function cnpjIsValid(cnpj: string) {
    const clearedCnpj = cnpj;

    if (clearedCnpj.length !== 14) {
      return false;
    }

    if (/^(\d)\1{13}$/.test(clearedCnpj)) {
      return false;
    }

    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clearedCnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(clearedCnpj.charAt(12)) !== digit1) {
      return false;
    }

    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(clearedCnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(clearedCnpj.charAt(13)) !== digit2) {
      return false;
    }

    return true;
  }

  function documentIsValid(document: string) {
    const clearedDocument = document;
    if (clearedDocument.length <= 11) return cpfIsValid(document);
    return cnpjIsValid(document);
  }

  function notZero(value: string) {
    if (Number(value) === 0) return 'Insira um valor';
    return true;
  }

  function isValidState(value: string) {
    if (value.length !== 2) return 'Insira 2 dígitos';
    return true;
  }

  function isValidZipCode(val: string): string | boolean {
    const pattern = /^\d{5}-\d{3}$/;
    return pattern.test(val) || 'Digite um CEP válido no formato 00000-000';
  }

  function sameAs(
    compareValue: string | null | undefined,
    errorMessage = 'Os valores não conferem',
  ) {
    return (val: string) => {
      // Se ambos estão vazios, é válido
      if ((!val || val.trim() === '') && (!compareValue || compareValue.trim() === '')) {
        return true;
      }

      // Se os valores são diferentes, retorna erro
      if (val !== compareValue) {
        return errorMessage;
      }

      return true;
    };
  }

  return {
    required,
    requiredNumber,
    requiredPrice,
    isValidTime,
    isValidEmail,
    min6,
    notZero,
    min11Numbers,
    cpfIsValid,
    cnpjIsValid,
    documentIsValid,
    isValidPhone,
    isValidState,
    isValidZipCode,
    sameAs,
  };
}
