interface IContribution {
  memberId: string;
  months: Record<string, boolean>;
  year: number;
}

export { IContribution };
