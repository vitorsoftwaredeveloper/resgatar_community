import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";
import { EXPENSE_CATEGORY_VALUES } from "../constants/expenses";

const ExpenseSchema = new Schema(
  {
    description: { type: String, required: true },
    amount: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: EXPENSE_CATEGORY_VALUES,
    },
    referenceMonth: { type: Number, required: true, min: 0, max: 11 },
    referenceYear: { type: Number, required: true },
    date: { type: Number, required: true },
    note: { type: String },
    adminId: { type: String, required: true },
  },
  { timestamps: true },
);

export const ExpenseModel = createInstanceMongoose("expenses", ExpenseSchema);
