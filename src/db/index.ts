import mongoose from "mongoose";
import { getSsmParameter } from "../utils/ssm";

let connection: any = null;

const resolveConnectionString = async (): Promise<string> => {
  const dbEnv = process.env.DB as string;

  // Local/dev usa a connection string direta; hml/prod recebem o NOME do
  // parâmetro no SSM e buscam o valor em runtime (fora do env em texto plano).
  if (dbEnv.startsWith("mongodb")) {
    return dbEnv;
  }

  return getSsmParameter(dbEnv);
};

export const db = async () => {
  try {
    if (connection) {
      console.log("db connection reused");
      return connection;
    }

    const connectionString = await resolveConnectionString();
    connection = await mongoose.connect(connectionString);
    console.log("connection database successful");
    return connection;
  } catch (err) {
    console.log("connection database error", err);
  }
};
