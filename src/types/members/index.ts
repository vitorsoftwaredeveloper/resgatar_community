type MemberRole = "admin" | "user" | "guest";

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
}

type IMember = Omit<ISignUpPayload, "password"> & {
  role: MemberRole;
  status: "active" | "defaulter";
  pushToken?: string | null;
  lastActiveAt?: Date;
  deletionWarnedAt?: Date | null;
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

export { MemberRole, ISignUpPayload, IMember, IMemberCredentials };
