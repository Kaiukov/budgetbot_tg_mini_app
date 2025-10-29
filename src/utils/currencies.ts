/**
 * Currency utility based on Google's canonical currency dataset
 * Source: https://raw.githubusercontent.com/google/dspl/master/samples/google/canonical/currencies.csv
 */

export interface CurrencyInfo {
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  AED: { symbol: '', name: 'UAE Dirham' },
  AFN: { symbol: '؋', name: 'Afghani' },
  ALL: { symbol: 'Lek', name: 'Lek' },
  AMD: { symbol: '', name: 'Armenian Dram' },
  ANG: { symbol: 'ƒ', name: 'Netherlands Antillian Guilder' },
  AOA: { symbol: '', name: 'Kwanza' },
  ARS: { symbol: '$', name: 'Argentine Peso' },
  AUD: { symbol: '$', name: 'Australian Dollar' },
  AWG: { symbol: 'ƒ', name: 'Aruban Guilder' },
  AZN: { symbol: 'ман', name: 'Azerbaijanian Manat' },
  BAM: { symbol: 'KM', name: 'Convertible Marks' },
  BBD: { symbol: '$', name: 'Barbados Dollar' },
  BDT: { symbol: '', name: 'Taka' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev' },
  BHD: { symbol: '', name: 'Bahraini Dinar' },
  BIF: { symbol: '', name: 'Burundi Franc' },
  BMD: { symbol: '$', name: 'Bermudian Dollar' },
  BND: { symbol: '$', name: 'Brunei Dollar' },
  BOB: { symbol: '$b', name: 'Boliviano' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  BSD: { symbol: '$', name: 'Bahamian Dollar' },
  BWP: { symbol: 'P', name: 'Pula' },
  BYR: { symbol: 'p.', name: 'Belarussian Ruble' },
  BZD: { symbol: 'BZ$', name: 'Belize Dollar' },
  CAD: { symbol: '$', name: 'Canadian Dollar' },
  CDF: { symbol: '', name: 'Congolese Franc' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  CLP: { symbol: '$', name: 'Chilean Peso' },
  CNY: { symbol: '¥', name: 'Yuan Renminbi' },
  COP: { symbol: '$', name: 'Colombian Peso' },
  CRC: { symbol: '₡', name: 'Costa Rican Colon' },
  CUP: { symbol: '₱', name: 'Cuban Peso' },
  CVE: { symbol: '', name: 'Cape Verde Escudo' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna' },
  DJF: { symbol: '', name: 'Djibouti Franc' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  DOP: { symbol: 'RD$', name: 'Dominican Peso' },
  DZD: { symbol: '', name: 'Algerian Dinar' },
  EEK: { symbol: '', name: 'Kroon' },
  EGP: { symbol: '£', name: 'Egyptian Pound' },
  ERN: { symbol: '', name: 'Nakfa' },
  ETB: { symbol: '', name: 'Ethiopian Birr' },
  EUR: { symbol: '€', name: 'Euro' },
  FJD: { symbol: '$', name: 'Fiji Dollar' },
  FKP: { symbol: '£', name: 'Falkland Islands Pound' },
  GBP: { symbol: '£', name: 'Pound Sterling' },
  GEL: { symbol: '', name: 'Lari' },
  GHS: { symbol: '', name: 'Cedi' },
  GIP: { symbol: '£', name: 'Gibraltar Pound' },
  GMD: { symbol: '', name: 'Dalasi' },
  GNF: { symbol: '', name: 'Guinea Franc' },
  GTQ: { symbol: 'Q', name: 'Quetzal' },
  GYD: { symbol: '$', name: 'Guyana Dollar' },
  HKD: { symbol: '$', name: 'Hong Kong Dollar' },
  HNL: { symbol: 'L', name: 'Lempira' },
  HRK: { symbol: 'kn', name: 'Croatian Kuna' },
  HTG: { symbol: '', name: 'Gourde' },
  HUF: { symbol: 'Ft', name: 'Forint' },
  IDR: { symbol: 'Rp', name: 'Rupiah' },
  ILS: { symbol: '₪', name: 'New Israeli Sheqel' },
  INR: { symbol: '', name: 'Indian Rupee' },
  IQD: { symbol: '', name: 'Iraqi Dinar' },
  IRR: { symbol: '﷼', name: 'Iranian Rial' },
  ISK: { symbol: 'kr', name: 'Iceland Krona' },
  JMD: { symbol: 'J$', name: 'Jamaican Dollar' },
  JOD: { symbol: '', name: 'Jordanian Dinar' },
  JPY: { symbol: '¥', name: 'Yen' },
  KES: { symbol: '', name: 'Kenyan Shilling' },
  KGS: { symbol: 'лв', name: 'Som' },
  KHR: { symbol: '៛', name: 'Riel' },
  KMF: { symbol: '', name: 'Comoro Franc' },
  KPW: { symbol: '₩', name: 'North Korean Won' },
  KRW: { symbol: '₩', name: 'Won' },
  KWD: { symbol: '', name: 'Kuwaiti Dinar' },
  KYD: { symbol: '$', name: 'Cayman Islands Dollar' },
  KZT: { symbol: 'лв', name: 'Tenge' },
  LAK: { symbol: '₭', name: 'Kip' },
  LBP: { symbol: '£', name: 'Lebanese Pound' },
  LKR: { symbol: '₨', name: 'Sri Lanka Rupee' },
  LRD: { symbol: '$', name: 'Liberian Dollar' },
  LTL: { symbol: 'Lt', name: 'Lithuanian Litas' },
  LVL: { symbol: 'Ls', name: 'Latvian Lats' },
  LYD: { symbol: '', name: 'Libyan Dinar' },
  MAD: { symbol: '', name: 'Moroccan Dirham' },
  MDL: { symbol: '', name: 'Moldovan Leu' },
  MGA: { symbol: '', name: 'Malagasy Ariary' },
  MKD: { symbol: 'ден', name: 'Denar' },
  MMK: { symbol: '', name: 'Kyat' },
  MNT: { symbol: '₮', name: 'Tugrik' },
  MOP: { symbol: '', name: 'Pataca' },
  MRO: { symbol: '', name: 'Ouguiya' },
  MUR: { symbol: '₨', name: 'Mauritius Rupee' },
  MVR: { symbol: '', name: 'Rufiyaa' },
  MWK: { symbol: '', name: 'Kwacha' },
  MXN: { symbol: '$', name: 'Mexican Peso' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
  MZN: { symbol: 'MT', name: 'Metical' },
  NGN: { symbol: '₦', name: 'Naira' },
  NIO: { symbol: 'C$', name: 'Cordoba Oro' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  NPR: { symbol: '₨', name: 'Nepalese Rupee' },
  NZD: { symbol: '$', name: 'New Zealand Dollar' },
  OMR: { symbol: '﷼', name: 'Rial Omani' },
  PAB: { symbol: 'B/.', name: 'Balboa' },
  PEN: { symbol: 'S/.', name: 'Nuevo Sol' },
  PGK: { symbol: '', name: 'Kina' },
  PHP: { symbol: 'Php', name: 'Philippine Peso' },
  PKR: { symbol: '₨', name: 'Pakistan Rupee' },
  PLN: { symbol: 'zł', name: 'Zloty' },
  PYG: { symbol: 'Gs', name: 'Guarani' },
  QAR: { symbol: '﷼', name: 'Qatari Rial' },
  RON: { symbol: 'lei', name: 'New Leu' },
  RSD: { symbol: 'Дин.', name: 'Serbian Dinar' },
  RUB: { symbol: 'руб', name: 'Russian Ruble' },
  RWF: { symbol: '', name: 'Rwanda Franc' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal' },
  SBD: { symbol: '$', name: 'Solomon Islands Dollar' },
  SCR: { symbol: '₨', name: 'Seychelles Rupee' },
  SDG: { symbol: '', name: 'Sudanese Pound' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  SGD: { symbol: '$', name: 'Singapore Dollar' },
  SHP: { symbol: '£', name: 'Saint Helena Pound' },
  SLL: { symbol: '', name: 'Leone' },
  SOS: { symbol: 'S', name: 'Somali Shilling' },
  SRD: { symbol: '$', name: 'Surinam Dollar' },
  STD: { symbol: '', name: 'Dobra' },
  SVC: { symbol: '$', name: 'El Salvador Colon' },
  SYP: { symbol: '£', name: 'Syrian Pound' },
  SZL: { symbol: '', name: 'Lilangeni' },
  THB: { symbol: '฿', name: 'Baht' },
  TJS: { symbol: '', name: 'Somoni' },
  TMT: { symbol: '', name: 'Manat' },
  TND: { symbol: '', name: 'Tunisian Dinar' },
  TOP: { symbol: '', name: "Pa'anga" },
  TRY: { symbol: 'TL', name: 'Turkish Lira' },
  TTD: { symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
  TWD: { symbol: 'NT$', name: 'New Taiwan Dollar' },
  TZS: { symbol: '', name: 'Tanzanian Shilling' },
  UAH: { symbol: '₴', name: 'Hryvnia' },
  UGX: { symbol: '', name: 'Uganda Shilling' },
  USD: { symbol: '$', name: 'US Dollar' },
  UYU: { symbol: '$U', name: 'Peso Uruguayo' },
  UZS: { symbol: 'лв', name: 'Uzbekistan Sum' },
  VEF: { symbol: 'Bs', name: 'Bolivar Fuerte' },
  VND: { symbol: '₫', name: 'Dong' },
  VUV: { symbol: '', name: 'Vatu' },
  WST: { symbol: '', name: 'Tala' },
  XAF: { symbol: '', name: 'CFA Franc BEAC' },
  XAG: { symbol: '', name: 'Silver' },
  XAU: { symbol: '', name: 'Gold' },
  XBA: { symbol: '', name: 'Bond Markets Units European Composite Unit' },
  XBB: { symbol: '', name: 'European Monetary Unit' },
  XBC: { symbol: '', name: 'European Unit of Account 9' },
  XBD: { symbol: '', name: 'European Unit of Account 17' },
  XCD: { symbol: '$', name: 'East Caribbean Dollar' },
  XDR: { symbol: '', name: 'SDR' },
  XFU: { symbol: '', name: 'UIC-Franc' },
  XOF: { symbol: '', name: 'CFA Franc BCEAO' },
  XPD: { symbol: '', name: 'Palladium' },
  XPF: { symbol: '', name: 'CFP Franc' },
  XPT: { symbol: '', name: 'Platinum' },
  XTS: { symbol: '', name: 'Testing Purposes' },
  YER: { symbol: '﷼', name: 'Yemeni Rial' },
  ZAR: { symbol: 'R', name: 'Rand' },
  ZMK: { symbol: '', name: 'Zambian Kwacha' },
  ZWL: { symbol: '', name: 'Zimbabwe Dollar' }
} as const;

/**
 * Get currency symbol for a given currency code
 * Falls back to currency code if symbol is not available
 *
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR")
 * @returns Currency symbol or code as fallback
 *
 * @example
 * getCurrencySymbol('USD') // Returns: '$'
 * getCurrencySymbol('EUR') // Returns: '€'
 * getCurrencySymbol('INR') // Returns: 'INR' (no symbol available)
 */
export function getCurrencySymbol(currencyCode: string | undefined): string {
  if (!currencyCode) return '';

  const code = currencyCode.toUpperCase();
  const currency = CURRENCIES[code];

  // If symbol exists and is not empty, return it
  // Otherwise fallback to currency code
  return currency?.symbol || code;
}

/**
 * Get full currency name for a given currency code
 *
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR")
 * @returns Full currency name or undefined if not found
 *
 * @example
 * getCurrencyName('USD') // Returns: 'US Dollar'
 * getCurrencyName('EUR') // Returns: 'Euro'
 */
export function getCurrencyName(currencyCode: string | undefined): string | undefined {
  if (!currencyCode) return undefined;

  const code = currencyCode.toUpperCase();
  return CURRENCIES[code]?.name;
}

/**
 * Format amount with currency symbol or code
 * Shows symbol if available, otherwise shows code
 *
 * @param amount - Numeric amount
 * @param currencyCode - ISO 4217 currency code
 * @param showCode - Always show currency code alongside symbol (default: false)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(100, 'USD') // Returns: '$100'
 * formatCurrency(100, 'USD', true) // Returns: '$100 USD'
 * formatCurrency(100, 'INR') // Returns: '100 INR' (no symbol)
 * formatCurrency(100, 'EUR') // Returns: '€100'
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string | undefined,
  showCode: boolean = false
): string {
  if (!currencyCode) return String(amount);

  const code = currencyCode.toUpperCase();
  const currency = CURRENCIES[code];
  const symbol = currency?.symbol;

  // If symbol exists and is not empty
  if (symbol) {
    return showCode ? `${symbol}${amount} ${code}` : `${symbol}${amount}`;
  }

  // Fallback to code
  return `${amount} ${code}`;
}

/**
 * Check if a currency code is valid
 *
 * @param currencyCode - Currency code to validate
 * @returns true if currency code exists in database
 */
export function isValidCurrency(currencyCode: string | undefined): boolean {
  if (!currencyCode) return false;
  return currencyCode.toUpperCase() in CURRENCIES;
}
