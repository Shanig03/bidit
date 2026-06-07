const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const numericValue = Number(String(value).replace(/,/g, ''));

  if (Number.isNaN(numericValue)) {
    return '0';
  }

  return numberFormatter.format(numericValue);
}

export function formatNumericInput(value) {
  const digits = String(value).replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return numberFormatter.format(Number(digits));
}

export function parseFormattedNumber(value) {
  return Number(String(value).replace(/,/g, ''));
}
