import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

// Meta mensal de arrecadação definida por um administrador. É o valor-alvo do
// mês: a meta é considerada "batida" quando o arrecadado (contribuições pagas +
// doações aprovadas) atinge esse valor. Despesas NÃO entram nessa comparação.
// Alinhado ao padrão financeiro do projeto: referenceMonth 0-indexado e valor
// como string "xx,xx".
const MonthlyGoalSchema = new Schema(
  {
    // 0-indexado (0 = janeiro), alinhado ao Expense e ao Donation.
    referenceMonth: { type: Number, required: true, min: 0, max: 11 },
    referenceYear: { type: Number, required: true },
    amount: { type: String, required: true }, // "xx,xx"
    adminId: { type: String, required: true },
  },
  { timestamps: true },
);

// Uma única meta por mês.
MonthlyGoalSchema.index(
  { referenceYear: 1, referenceMonth: 1 },
  { unique: true },
);

export const MonthlyGoalModel = createInstanceMongoose(
  "monthlygoals",
  MonthlyGoalSchema,
);
