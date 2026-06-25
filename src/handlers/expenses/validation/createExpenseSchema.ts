import {
  EXPENSE_CATEGORY_VALUES,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
  MAX_EXPENSE_NOTE_LENGTH,
} from "../../../constants/expenses";

export const createExpenseSchema: any = {
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
  },
  required: [
    "description",
    "amount",
    "category",
    "referenceMonth",
    "referenceYear",
    "date",
  ],
  additionalProperties: false,
};
