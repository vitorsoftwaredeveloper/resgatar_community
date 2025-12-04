import mongoose, { mongo } from "mongoose";

let connection: any = null;
export const db = async () => {
  if (connection) {
    return connection;
  }

  connection = await mongoose.connect(process.env.DB as string);
  return connection;
};
