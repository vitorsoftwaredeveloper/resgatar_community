interface SignUpPayload {
  _id: string;
  email: string;
  password: string;
  phoneNumber: string;
  name?: string;
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
  role?: "admin" | "user";
}

type SignUpPayloadDTO = Omit<SignUpPayload, "password"> & {
  status: "active" | "defaulter";
};

export { SignUpPayload, SignUpPayloadDTO };
