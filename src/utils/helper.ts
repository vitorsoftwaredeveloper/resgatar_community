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

function parseDateBRToUTC(date: string): number {
  const [day, month, year] = date.split("/").map(Number);

  if (!day || !month || !year) {
    throw new Error("Data inválida");
  }

  return Date.UTC(year, month - 1, day);
}

/**
 * Converte timestamp UTC → DD/MM/YYYY
 */
function formatUTCToDateBR(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { decodeToken, parseDateBRToUTC, formatUTCToDateBR, escapeRegExp };
