interface ICreateDonationPixPayload {
  amount: string; // "xx,xx"
  donorName?: string;
}

interface IRegisterCashDonationPayload {
  amount: string; // "xx,xx"
  donorName?: string;
  referenceMonth?: number; // 0-indexado; default = mês atual
}

interface IDonationDTO {
  transactionId: string;
  memberId: string;
  donorName?: string;
  amount: string;
  paymentMethodId: "pix" | "cash";
  status: string;
  statusDetail?: string;
  currencyId?: string;
  dateCreated?: string | Date;
  dateOfExpiration?: string | Date;
  dateApproved?: string | Date;
  referenceMonth: number;
  referenceYear: number;
  transactionData?: {
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  };
}

export {
  ICreateDonationPixPayload,
  IRegisterCashDonationPayload,
  IDonationDTO,
};
