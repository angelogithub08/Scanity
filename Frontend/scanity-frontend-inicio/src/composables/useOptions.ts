import type { Option } from 'src/interfaces/options';
import { computed } from 'vue';

// Opções de tipos de usuário
const userTypeOptions = [
  { label: 'Usuário', value: 'USER' },
  { label: 'Administrador', value: 'ADMIN' },
];

// Opções de gênero
const genderOptions = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Feminino', value: 'FEMININO' },
  { label: 'Outro', value: 'OUTRO' },
];

const serviceUnitTypeOptions = [
  { label: 'Quantidade', value: 'QUANTIDADE' },
  { label: 'Unidade', value: 'UNIDADE' },
  { label: 'Metro Quadrado', value: 'M2' },
  { label: 'Metro Cúbico', value: 'M3' },
];

const availabilityTypeOptions = [
  { label: 'Quantidade', value: 'QUANTIDADE' },
  { label: 'Disponibilidade', value: 'DISPONIBILIDADE' },
];

const typeFinancialCategoryOptions = [
  { label: 'Receita', value: 'RECEITA' },
  { label: 'Despesa', value: 'DESPESA' },
];

const transactionTypeOptions = [
  { label: 'Entrada', value: 'ENTRADA' },
  { label: 'Saída', value: 'SAIDA' },
];

const feeTypeOptions = [
  { label: 'Valor', value: 'VALOR' },
  { label: 'Percentual', value: 'PERCENTUAL' },
];

const discountTypeOptions = [
  { label: 'Valor', value: 'VALOR' },
  { label: 'Percentual', value: 'PERCENTUAL' },
];

const subscriptionStatusOptions = [
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Cancelado', value: 'CANCELED' },
];

const chargeStatusOptions = [
  { label: 'Confirmado', value: 'CONFIRMED' },
  { label: 'Reembolsado', value: 'REFUNDED' },
  { label: 'Cancelado', value: 'CANCELED' },
  { label: 'Vencido', value: 'OVERDUE' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Pago', value: 'PAID' },
  { label: 'Falhou', value: 'FAILED' },
];

// Utilitário para transformar UPPERCASE em Capitalize
function capitalizeOption(option: string) {
  if (!option) return '';
  return option.charAt(0).toUpperCase() + option.slice(1).toLowerCase();
}

// Utilitário para resgatar a label de uma opção
function getLabel(list: Option[], value: string) {
  const found = list.find((o) => o.value === value);
  return found?.label;
}

// Traduz status de subscription
function getSubscriptionStatusLabel(status: string) {
  return getLabel(subscriptionStatusOptions, status) || status;
}

// Traduz status de charge
function getChargeStatusLabel(status: string) {
  return getLabel(chargeStatusOptions, status) || status;
}

// Retorna as opções e utilitários
export function useOptions() {
  return {
    userTypeOptions: computed(() => userTypeOptions),
    genderOptions: computed(() => genderOptions),
    serviceUnitTypeOptions: computed(() => serviceUnitTypeOptions),
    availabilityTypeOptions: computed(() => availabilityTypeOptions),
    typeFinancialCategoryOptions: computed(() => typeFinancialCategoryOptions),
    transactionTypeOptions: computed(() => transactionTypeOptions),
    feeTypeOptions: computed(() => feeTypeOptions),
    discountTypeOptions: computed(() => discountTypeOptions),
    subscriptionStatusOptions: computed(() => subscriptionStatusOptions),
    chargeStatusOptions: computed(() => chargeStatusOptions),
    getLabel,
    capitalizeOption,
    getSubscriptionStatusLabel,
    getChargeStatusLabel,
  };
}
