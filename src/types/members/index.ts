interface ISignUpPayload {
  _id: string;
  email: string;
  password: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  bio?: string;
  age?: number;
  address?: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  paymentInfo: {
    datePayment: number;
    amount: number;
  };
  identification: {
    type: "CPF" | "CNPJ";
    number: string;
  };
  role?: "admin" | "user";
}

type IMember = Omit<ISignUpPayload, "password"> & {
  status: "active" | "defaulter";
};

export { ISignUpPayload, IMember };
