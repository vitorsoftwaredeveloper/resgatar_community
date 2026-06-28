import { CommitmentModel } from "../../models/Commitment";
import { STATUS_CODE } from "../../constants";
import {
  ICommitmentResponse,
  ICreateCommitmentPayload,
} from "../../types/commitments";
import { verifyAdmin } from "../helper";
import { buildCommitmentFields } from "./buildCommitmentFields";

// Edita um compromisso existente (substituição completa dos campos editáveis).
// O modo/âncora podem mudar, então a data e o dia são recalculados; `order`
// é preservado.
export const editCommitmentService = async (
  adminId: string,
  commitmentId: string,
  payload: ICreateCommitmentPayload,
): Promise<ICommitmentResponse> => {
  console.log("IN - editCommitmentService");

  try {
    await verifyAdmin(adminId);

    const commitment = await CommitmentModel.findById(
      commitmentId,
      { _id: 1 },
      { lean: true },
    );

    if (!commitment) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Compromisso não encontrado.",
      };
    }

    const fields = buildCommitmentFields(payload);

    await CommitmentModel.updateOne({ _id: commitmentId }, fields);

    console.log("OUT - editCommitmentService");

    return {
      id: commitmentId,
      title: fields.title,
      day: fields.day,
      time: fields.time,
      location: fields.location,
      repeat: fields.repeat,
      weekday: fields.weekday,
      ordinal: fields.ordinal,
      date: fields.date ? fields.date.toISOString() : null,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - editCommitmentService");
  }
};
