export const DISPUTE_TYPES = [
  {
    value: "Chargeback",
    label: "Chargeback",
    description: "Card dispute for an incorrect, duplicate, or unresolved transaction.",
  },
  {
    value: "Refund Denial",
    label: "Refund Denial",
    description: "Merchant has refused or delayed a refund after a return or cancellation.",
  },
  {
    value: "Unauthorized Charge",
    label: "Unauthorized Charge",
    description: "Transaction was not approved by the customer.",
  },
  {
    value: "Service Failure",
    label: "Service Failure",
    description: "Paid service was never delivered or materially failed.",
  },
  {
    value: "Delivery Issue",
    label: "Delivery Issue",
    description: "Product was lost, damaged, late, or not as described.",
  },
  {
    value: "Billing Error",
    label: "Billing Error",
    description: "Incorrect pricing, duplicate billing, or subscription issues.",
  },
] as const;
