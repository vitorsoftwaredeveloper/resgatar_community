interface SignUpPayload {
  email: string;
  password: string;
  passwordSalt: string;
  username?: string;
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
  role?: "admin" | "user";
}

export { SignUpPayload };
