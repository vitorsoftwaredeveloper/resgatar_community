import { v4 as uuidv4 } from "uuid";
import { CommitmentModel } from "../../models/Commitment";
import {
  ICommitment,
  ICommitmentResponse,
  ICreateCommitmentPayload,
} from "../../types/commitments";
import { verifyAdmin } from "../helper";
import { buildCommitmentFields } from "./buildCommitmentFields";

// Cria um compromisso no fim do mural. A data concreta (monthly/once) e o nome
// do dia são derivados do modo de repetição; o admin reposiciona depois.
export const createCommitmentService = async (
  adminId: string,
  payload: ICreateCommitmentPayload,
): Promise<ICommitmentResponse> => {
  console.log("IN - createCommitmentService");

  try {
    await verifyAdmin(adminId);

    const fields = buildCommitmentFields(payload);
    const total = await CommitmentModel.count({});

    const commitment: ICommitment = {
      _id: uuidv4(),
      ...fields,
      order: total,
    };

    await CommitmentModel.insertOne(commitment);

    console.log("OUT - createCommitmentService");

    return {
      id: commitment._id,
      title: commitment.title,
      day: commitment.day,
      time: commitment.time,
      location: commitment.location,
      repeat: commitment.repeat,
      weekday: commitment.weekday,
      ordinal: commitment.ordinal,
      date: commitment.date ? commitment.date.toISOString() : null,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createCommitmentService");
  }
};
