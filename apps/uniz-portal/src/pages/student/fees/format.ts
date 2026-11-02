export const rupees = (paise: number) =>
  `Rs ${(Number(paise || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const PAYMENTS_COMING_SOON = "Payments coming soon";
