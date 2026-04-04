export interface AsaasCustomerResponse {
  object: string;
  id: string;
  dateCreated: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  canDelete?: boolean;
  canNotBeDeletedReason?: string;
  canNotBeDeletedReasonDescription?: string;
  personType?: string;
  company?: string;
}

export interface AsaasChargeResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: string;
  status: string;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted?: boolean;
  anticipated?: boolean;
  anticipable?: boolean;
  refunds?: unknown;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: string;
  };
  fine?: {
    value: number;
    type: string;
  };
  interest?: {
    value: number;
    type: string;
  };
  split?: unknown[];
  chargeback?: unknown;
  postalService?: boolean;
}

export interface AsaasCreditCardResponse {
  object: string;
  id?: string;
  creditCardToken?: string;
  creditCardNumber?: string;
  creditCardBrand?: string;
  creditCardHolderName?: string;
  creditCardHolderCpfCnpj?: string;
  creditCardExpiryMonth?: string;
  creditCardExpiryYear?: string;
}

export interface AsaasRequestInvoiceResponse {
  object: string;
  id: string;
  status:
    | 'SCHEDULED'
    | 'AUTHORIZED'
    | 'PROCESSING_CANCELLATION'
    | 'CANCELED'
    | 'CANCELLATION_DENIED'
    | 'ERROR';
  customer: string;
  payment: string;
  installment?: string;
  type: 'NFS-e';
  statusDescription: string;
  serviceDescription: string;
  pdfUrl?: string;
  xmlUrl?: string;
  rpsSerie: string;
  rpsNumber?: string;
  number?: string;
  validationCode?: string;
  value: number;
  deductions: number;
  effectiveDate: string;
  observations: string;
  estimatedTaxesDescription?: string;
  externalReference?: string;
  taxes: {
    retainIss: boolean;
    cofins: number;
    csll: number;
    inss: number;
    ir: number;
    pis: number;
    iss: number;
  };
  municipalServiceId?: string;
  municipalServiceCode?: string;
  municipalServiceName: string;
}

export interface AsaasCustomerFiscalInfoResponse {
  object: string;
  simplesNacional: boolean;
  rpsSerie: string;
  rpsNumber: number;
  loteNumber?: string | null;
  username: string;
  passwordSent: boolean;
  accessTokenSent: boolean;
  certificateSent: boolean;
  specialTaxRegime: string;
  email: string;
  serviceListItem?: string;
  cnae: string;
  culturalProjectsPromoter: boolean;
  municipalInscription: string;
  useNationalPortal: boolean;
  nationalPortalTaxCalculationRegime?: string | null;
  aedf?: string | null;
  nbsCode?: string | null;
  nbsDescription?: string | null;
}

export interface AsaasMunicipalService {
  id: string;
  description: string;
  issTax: number;
}

export interface AsaasMunicipalServicesResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasMunicipalService[];
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
  description: string;
}

export interface AsaasStatusChargeResponse {
  status: string;
}

export interface AsaasPaymentsResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: any[];
}
