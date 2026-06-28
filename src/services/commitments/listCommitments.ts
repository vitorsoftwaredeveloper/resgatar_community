import { CommitmentModel } from "../../models/Commitment";
import { ICommitmentResponse } from "../../types/commitments";

// Qualquer membro autenticado lê o mural. Os semanais (sem data) vêm primeiro,
// na ordem curada; os datados (monthly/once) seguem em ordem cronológica.
export const listCommitmentsService = async (): Promise<
  ICommitmentResponse[]
> => {
  console.log("IN - listCommitmentsService");

  const commitments = await CommitmentModel.find(
    {},
    {
      _id: 1,
      title: 1,
      day: 1,
      time: 1,
      location: 1,
      repeat: 1,
      weekday: 1,
      ordinal: 1,
      date: 1,
    },
    { sort: { date: 1, order: 1 }, lean: true },
  );

  console.log("OUT - listCommitmentsService");

  return commitments.map((c: any) => ({
    id: c._id,
    title: c.title,
    day: c.day,
    time: c.time,
    location: c.location,
    repeat: c.repeat,
    weekday: c.weekday ?? null,
    ordinal: c.ordinal ?? null,
    date: c.date ? new Date(c.date).toISOString() : null,
  }));
};
