import { CommitmentModel } from "../../models/Commitment";
import { ICommitmentResponse } from "../../types/commitments";
import { verifyDashboardVisibility } from "../helper";

export const listCommitmentsService = async (
  requesterId: string,
): Promise<ICommitmentResponse[]> => {
  console.log("IN - listCommitmentsService");

  await verifyDashboardVisibility(requesterId, "notices");

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
    { sort: { order: 1 }, lean: true },
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
