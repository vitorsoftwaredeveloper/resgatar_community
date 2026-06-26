import {
  EXPENSE_CATEGORY_VALUES,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
  MAX_EXPENSE_NOTE_LENGTH,
} from "../../../constants/expenses";

// Edição parcial: todos os campos são opcionais, mas nenhum extra é aceito
// (additionalProperties:false bloqueia, por exemplo, tentar alterar adminId).
export const editExpenseSchema: any = {
  type: "object",
  properties: {
    description: {
      type: "string",
      minLength: 1,
      maxLength: MAX_EXPENSE_DESCRIPTION_LENGTH,
    },
    amount: { type: "string", pattern: "^[0-9]+,[0-9]{2}$" },
    category: { type: "string", enum: EXPENSE_CATEGORY_VALUES },
    referenceMonth: { type: "number", minimum: 0, maximum: 11 },
    referenceYear: { type: "number", minimum: 2000, maximum: 2100 },
    date: { type: "number", minimum: 0 },
    note: {
      type: "string",
      maxLength: MAX_EXPENSE_NOTE_LENGTH,
      nullable: true,
    },
    receiptKey: { type: "string", nullable: true },
  },
  required: [],
  additionalProperties: false,
};
