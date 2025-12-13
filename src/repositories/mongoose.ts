import { Schema, Model, model, models } from "mongoose";
import { db } from "../db";

export function createInstanceMongoose<T>(
  modelName: string,
  schema: Schema<T>
) {
  const mongooseModel: Model<T> =
    models[modelName] || model<T>(modelName, schema);

  return {
    insertOne: async (data: any, options?: any) => {
      await db();

      const document = new mongooseModel(data);
      return await document.save({ ...options });
    },
    updateOne: async (filter: any, data: any, options?: any) => {
      await db();
      return await mongooseModel.updateOne(filter, data, { ...options });
    },
    findOne: async (filter: any, options?: any) => {
      await db();
      return await mongooseModel.findOne(filter, { ...options }).lean();
    },
    find: async (filter: any, options?: any) => {
      await db();
      return await mongooseModel.find(filter, { ...options }).lean();
    },
    findById: async (id: any, options?: any) => {
      await db();
      return await mongooseModel.findById(id, { ...options }).lean();
    },
    deleteOne: async (filter: any, options?: any) => {
      await db();
      return await mongooseModel.deleteOne(filter, { ...options });
    },
    count: async (filter: any, options?: any) => {
      await db();
      return await mongooseModel.countDocuments(filter, { ...options });
    },
  };
}
