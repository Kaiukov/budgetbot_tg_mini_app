import type { TransferForm } from '../machines/types';

const formatCurrencyCode = (value: string | number | undefined): string => {
  if (!value) return 'EUR';
  return String(value).toUpperCase();
};

export const buildTransferNotesFromContext = (transfer: TransferForm): string => {
  const sourceAccount = transfer.source_account_name || 'Source Account';
  const destAccount = transfer.destination_account_name || 'Destination Account';
  const sourceAmount = transfer.source_amount || '0';
  const destAmount = transfer.destination_amount || '0';
  const sourceCurrency = formatCurrencyCode(transfer.source_account_currency);
  const destCurrency = formatCurrencyCode(transfer.destination_account_currency);
  const sourceFee = transfer.source_fee || '0';
  const destFee = transfer.destination_fee || '0';

  const base = `transfer from ${sourceAccount} ${sourceAmount} ${sourceCurrency} to ${destAccount} ${destAmount} ${destCurrency}`;
  const hasSourceFee = parseFloat(sourceFee) > 0;
  const hasDestFee = parseFloat(destFee) > 0;

  if (hasSourceFee || hasDestFee) {
    const fees = `source fee ${sourceFee} ${sourceCurrency}, destination fee ${destFee} ${destCurrency}`;
    return `${base}. ${fees}`;
  }

  return base;
};
