import { CommitmentModel } from "../../models/Commitment";
import { STATUS_CODE } from "../../constants";
import { verifyAdmin } from "../helper";

// Remove um compromisso e fecha o buraco na sequência, reindexando os
// posteriores para manter `order` contíguo (0,1,2,...).
export const removeCommitmentService = async (
  adminId: string,
  commitmentId: string,
): Promise<void> => {
  console.log("IN - removeCommitmentService");

  try {
    await verifyAdmin(adminId);

    const commitment = await CommitmentModel.findById(
      commitmentId,
      { order: 1 },
      { lean: true },
    );

    if (!commitment) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Compromisso não encontrado.",
      };
    }

    await CommitmentModel.deleteOne({ _id: commitmentId });

    await CommitmentModel.updateMany(
      { order: { $gt: (commitment as any).order } },
      { $inc: { order: -1 } },
    );

    console.log("OUT - removeCommitmentService");
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeCommitmentService");
  }
};
