interface ISignUpPayload {
  _id: string;
  email: string;
  password: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  bio?: string;
  profileImage?: string;
  dateOfBirth: number;
  address?: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  paymentInfo: {
    datePayment: number;
    amount: string;
  };
  identification: {
    type: "CPF" | "CNPJ";
    numberType: string;
  };
  role: "admin" | "user";
}

type IMember = Omit<ISignUpPayload, "password"> & {
  status: "active" | "defaulter";
};

interface IMemberCredentials {
  sub: string;
  iss: string;
  client_id: string;
  origin_jti: string;
  event_id: string;
  token_use: string;
  scope: string;
  auth_time: number;
  exp: number;
  iat: number;
  jti: string;
  username: string;
}

export { ISignUpPayload, IMember, IMemberCredentials };
