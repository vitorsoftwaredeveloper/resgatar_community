import jwt from "jsonwebtoken";
import { IMemberCredentials } from "../types/members";

const decodeToken = (token: string): IMemberCredentials => {
  console.log("IN - decodeToken");

  try {
    return jwt.decode(token.replace("Bearer ", "")) as IMemberCredentials;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - decodeToken");
  }
};

export { decodeToken };
