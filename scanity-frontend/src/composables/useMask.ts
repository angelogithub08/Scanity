export function useMask() {
  const mask = {
    phone: '(##) #####-####',
    phone1: '(##) ####-####',
    phone2: '(##) #####-####',
    cpf: '###.###.###-##',
    cnpj: '##.###.###/####-##',
    rg: '##.###.###-#',
    zipcode: '#####-###',
    document: '',
  };

  const cpfCnpjMaskOptions = {
    mask: ['###.###.###-##', '##.###.###/####-##'],
    eager: true,
  };

  const phoneMaskOptions = {
    mask: ['(##) ####-####', '(##) #####-####'],
    eager: true,
  };

  const moneyConfig = {
    debug: false,
    masked: false,
    prefix: 'R$ ',
    suffix: '',
    thousands: '.',
    decimal: ',',
    precision: 2,
    disableNegative: false,
    disabled: false,
    min: null,
    max: null,
    allowBlank: false,
    minimumNumberOfCharacters: 0,
    modelModifiers: {
      number: false,
    },
    shouldRound: true,
    focusOnRight: false,
  };

  function cpfCnpjMask(value?: string | null) {
    if (!value) return value;
    return value.replace(/\D/g, '').length > 11
      ? '##.###.###/####-##' // CNPJ
      : '###.###.###-##'; // CPF
  }

  function onlyNumbers(value: string) {
    if (!value) return value;
    return value.replace(/\D/g, '');
  }

  function onlyLetters(value: string) {
    if (!value) return value;
    return value.replace(/[^a-zA-Z]/g, '');
  }

  function applyMask(inputValue: string, maskKey: keyof typeof mask) {
    const value = onlyNumbers(inputValue);
    let maskPattern = mask[maskKey];
    if (maskKey === 'document') {
      if (!value) return value;
      if (value.length === 11) {
        maskPattern = mask.cpf;
      } else if (value.length === 14) {
        maskPattern = mask.cnpj;
      } else if (value.length === 8) {
        // Exemplo de máscara para RM (Registro Municipal): '########' (sem máscara)
        maskPattern = '########';
      } else {
        // Se não bater com nenhum, não aplica máscara
        return value;
      }
    }
    if (maskKey === 'phone') {
      if (!value) return value;
      if (value.length === 10) {
        maskPattern = mask.phone1;
      } else if (value.length === 11) {
        maskPattern = mask.phone2;
      } else {
        return value;
      }
    }
    if (!maskPattern || !value) return value;
    let masked = '';
    let valueIndex = 0;
    for (let i = 0; i < maskPattern.length && valueIndex < value.length; i++) {
      if (maskPattern[i] === '#') {
        masked += value[valueIndex];
        valueIndex++;
      } else {
        masked += maskPattern[i];
      }
    }
    return masked;
  }

  function moneyToNumber(value: string) {
    if (!value) return value;
    return +value.replace(/\./g, '').replace(',', '.');
  }

  return {
    mask,
    moneyConfig,
    cpfCnpjMaskOptions,
    phoneMaskOptions,
    onlyNumbers,
    onlyLetters,
    applyMask,
    cpfCnpjMask,
    moneyToNumber,
  };
}
