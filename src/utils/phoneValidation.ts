/**
 * Utilitários para validação e formatação de números de telefone para WhatsApp
 * Suporta números nacionais brasileiros e internacionais
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  displayNumber?: string;
  error?: string;
  country?: string;
}

// Padrões de números aceitos pelo WhatsApp
const PHONE_PATTERNS = {
  // Brasil: 5511995736666 (código país + DDD + número)
  brazil: /^55[1-9][1-9]\d{8,9}$/,
  
  // Suíça: 41765099123 (código país + número)
  switzerland: /^41[1-9]\d{8}$/,
  
  // Estados Unidos: 1234567890 (10 dígitos)
  usa: /^1[2-9]\d{9}$/,
  
  // Reino Unido: 447700900123
  uk: /^44[1-9]\d{9,10}$/,
  
  // França: 33123456789
  france: /^33[1-9]\d{8}$/,
  
  // Alemanha: 491234567890
  germany: /^49[1-9]\d{10,11}$/,
  
  // Itália: 393123456789
  italy: /^39[3]\d{9}$/,
  
  // Espanha: 34612345678
  spain: /^34[6-9]\d{8}$/,
  
  // Argentina: 5491123456789
  argentina: /^549[1-9]\d{9,10}$/,
  
  // México: 521234567890
  mexico: /^52[1-9]\d{9,10}$/,
  
  // Canadá: 1234567890
  canada: /^1[2-9]\d{9}$/,
  
  // Austrália: 61412345678
  australia: /^61[4]\d{8}$/,
  
  // Japão: 8190123456789
  japan: /^81[7-9]\d{9,10}$/,
  
  // China: 8613812345678
  china: /^86[1]\d{10}$/,
  
  // Índia: 919876543210
  india: /^91[6-9]\d{9}$/,
  
  // Portugal: 351912345678
  portugal: /^351[9]\d{8}$/,
  
  // Chile: 56912345678
  chile: /^56[9]\d{8}$/,
  
  // Colômbia: 573123456789
  colombia: /^57[3]\d{9}$/,
  
  // Peru: 51987654321
  peru: /^51[9]\d{8}$/,
  
  // Uruguai: 59899123456
  uruguay: /^598[9]\d{7}$/,
  
  // Paraguai: 595981234567
  paraguay: /^595[9]\d{8}$/
};

const COUNTRY_NAMES = {
  brazil: 'Brasil',
  switzerland: 'Suíça',
  usa: 'Estados Unidos',
  uk: 'Reino Unido',
  france: 'França',
  germany: 'Alemanha',
  italy: 'Itália',
  spain: 'Espanha',
  argentina: 'Argentina',
  mexico: 'México',
  canada: 'Canadá',
  australia: 'Austrália',
  japan: 'Japão',
  china: 'China',
  india: 'Índia',
  portugal: 'Portugal',
  chile: 'Chile',
  colombia: 'Colômbia',
  peru: 'Peru',
  uruguay: 'Uruguai',
  paraguay: 'Paraguai'
};

/**
 * Remove todos os caracteres não numéricos do número
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Detecta o país baseado no código do país
 */
function detectCountry(cleanNumber: string): string | null {
  for (const [country, pattern] of Object.entries(PHONE_PATTERNS)) {
    if (pattern.test(cleanNumber)) {
      return country;
    }
  }
  return null;
}

/**
 * Formata número brasileiro para exibição
 */
function formatBrazilianNumber(cleanNumber: string): string {
  // 5511995736666 -> +55 11 99573-6666
  const countryCode = cleanNumber.substring(0, 2); // 55
  const areaCode = cleanNumber.substring(2, 4); // 11
  const firstPart = cleanNumber.substring(4, 9); // 99573
  const secondPart = cleanNumber.substring(9); // 6666
  
  return `+${countryCode} ${areaCode} ${firstPart}-${secondPart}`;
}

/**
 * Formata número internacional para exibição
 */
function formatInternationalNumber(cleanNumber: string, country: string): string {
  switch (country) {
    case 'switzerland':
      // 41765099123 -> +41 76 509 9123
      return `+${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 4)} ${cleanNumber.substring(4, 7)} ${cleanNumber.substring(7)}`;
    
    case 'usa':
    case 'canada':
      // 1234567890 -> +1 (234) 567-890
      return `+${cleanNumber.substring(0, 1)} (${cleanNumber.substring(1, 4)}) ${cleanNumber.substring(4, 7)}-${cleanNumber.substring(7)}`;
    
    case 'uk':
      // 447700900123 -> +44 7700 900123
      return `+${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 6)} ${cleanNumber.substring(6)}`;
    
    case 'france':
      // 33123456789 -> +33 1 23 45 67 89
      return `+${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 3)} ${cleanNumber.substring(3, 5)} ${cleanNumber.substring(5, 7)} ${cleanNumber.substring(7, 9)} ${cleanNumber.substring(9)}`;
    
    case 'germany':
      // 491234567890 -> +49 123 4567890
      return `+${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 5)} ${cleanNumber.substring(5)}`;
    
    default:
      // Formato genérico: +XX XXXXXXXXX
      const countryCode = cleanNumber.substring(0, 2);
      const number = cleanNumber.substring(2);
      return `+${countryCode} ${number}`;
  }
}

/**
 * Tenta corrigir automaticamente números brasileiros mal formatados
 */
function tryFixBrazilianNumber(cleanNumber: string): string | null {
  // Se tem 11 dígitos, pode ser um número brasileiro sem código do país
  if (cleanNumber.length === 11 && cleanNumber.match(/^[1-9][1-9]\d{8,9}$/)) {
    return '55' + cleanNumber;
  }
  
  // Se tem 10 dígitos, pode ser um número brasileiro antigo sem o 9
  if (cleanNumber.length === 10 && cleanNumber.match(/^[1-9][1-9]\d{7}$/)) {
    const areaCode = cleanNumber.substring(0, 2);
    const number = cleanNumber.substring(2);
    return '55' + areaCode + '9' + number;
  }
  
  // Se tem 13 dígitos e começa com 55, pode estar correto
  if (cleanNumber.length === 13 && cleanNumber.startsWith('55')) {
    return cleanNumber;
  }
  
  return null;
}

/**
 * Valida e formata um número de telefone para uso no WhatsApp
 */
export function validateAndFormatPhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Número de telefone é obrigatório'
    };
  }

  const cleanNumber = cleanPhoneNumber(phone);
  
  if (cleanNumber.length < 8) {
    return {
      isValid: false,
      error: 'Número muito curto. Mínimo 8 dígitos.'
    };
  }

  if (cleanNumber.length > 15) {
    return {
      isValid: false,
      error: 'Número muito longo. Máximo 15 dígitos.'
    };
  }

  // Primeiro, tenta detectar o país
  let country = detectCountry(cleanNumber);
  let finalNumber = cleanNumber;

  // Se não detectou país, tenta corrigir números brasileiros
  if (!country) {
    const fixedBrazilian = tryFixBrazilianNumber(cleanNumber);
    if (fixedBrazilian) {
      finalNumber = fixedBrazilian;
      country = detectCountry(finalNumber);
    }
  }

  // Se ainda não detectou país, retorna erro
  if (!country) {
    return {
      isValid: false,
      error: `Formato de número não reconhecido. Exemplos válidos:
      • Brasil: 5511995736666
      • Suíça: 41765099123
      • EUA: 12345678901
      • Reino Unido: 447700900123
      
      Certifique-se de incluir o código do país.`
    };
  }

  // Formata para exibição
  let displayNumber: string;
  if (country === 'brazil') {
    displayNumber = formatBrazilianNumber(finalNumber);
  } else {
    displayNumber = formatInternationalNumber(finalNumber, country);
  }

  return {
    isValid: true,
    formattedNumber: finalNumber,
    displayNumber,
    country: COUNTRY_NAMES[country as keyof typeof COUNTRY_NAMES] || country
  };
}

/**
 * Formata número para exibição (sem validação)
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  
  const cleanNumber = cleanPhoneNumber(phone);
  const country = detectCountry(cleanNumber);
  
  if (country === 'brazil') {
    return formatBrazilianNumber(cleanNumber);
  } else if (country) {
    return formatInternationalNumber(cleanNumber, country);
  }
  
  // Se não conseguir detectar, retorna formatação genérica
  if (cleanNumber.length >= 10) {
    return `+${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2)}`;
  }
  
  return phone;
}

/**
 * Verifica se um número é válido para WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const result = validateAndFormatPhone(phone);
  return result.isValid;
}