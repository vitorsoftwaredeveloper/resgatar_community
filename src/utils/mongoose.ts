import mongoose from "mongoose";
import { db } from "../db";

export async function executeMongoTransaction<T>(
  operations: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  console.log("IN - executeMongoTransaction");
  await db();
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      return await operations(session);
    });
  } finally {
    await session.endSession();
    console.log("OUT - executeMongoTransaction");
  }
}
