export const PAYMENT_TYPE_LABEL: Record<string, string> = {
  cash: 'Espèces',
  transfer: 'Virement bancaire',
  check: 'Chèque',
  card: 'Carte bancaire',
  invoice: 'Facture école',
}

export function paymentTypeLabel(key: string | null | undefined) {
  if (!key) return '—'
  return PAYMENT_TYPE_LABEL[key] ?? key
}
