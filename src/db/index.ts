import mongoose, { mongo } from "mongoose";

let connection: any = null;
export const db = async () => {
  console.log("IN - db");
  try {
    if (connection) {
      console.log("db connection reused");
      return connection;
    }

    connection = await mongoose.connect(process.env.DB as string);
    console.log("connection database successful");
    return connection;
  } catch (err) {
    console.log("connection database error", err);
  } finally {
    console.log("OUT - db");
  }
};
