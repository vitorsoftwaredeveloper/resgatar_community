interface ICreateExpensePayload {
  description: string;
  amount: string;
  category: string;
  referenceMonth: number;
  referenceYear: number;
  date: number;
  note?: string;
}

interface IExpense extends ICreateExpensePayload {
  _id?: string;
  adminId: string;
}

type IEditExpensePayload = Partial<ICreateExpensePayload>;

interface IExpenseDTO {
  _id: string;
  description: string;
  amount: string;
  category: string;
  referenceMonth: number;
  referenceYear: number;
  date: number;
  note?: string;
  adminId: string;
}

interface IExpensesSummary {
  year: number;
  month: number;
  total: number;
  count: number;
  byCategory: Record<string, number>;
  expenses: IExpenseDTO[];
}

export {
  ICreateExpensePayload,
  IEditExpensePayload,
  IExpense,
  IExpenseDTO,
  IExpensesSummary,
};
