interface SignUpPayload {
  email: string;
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

interface SignUpPayloadDTO extends SignUpPayload {
  status: "active" | "defaulter";
}

export { SignUpPayload, SignUpPayloadDTO };
