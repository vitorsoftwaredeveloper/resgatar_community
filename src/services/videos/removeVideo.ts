import { VideoModel } from "../../models/Video";
import { STATUS_CODE } from "../../constants";
import { verifyInternalMember } from "../helper";

export const removeVideoService = async (
  memberId: string,
  videoId: string,
): Promise<void> => {
  console.log("IN - removeVideoService");

  await verifyInternalMember(memberId);

  const video = await VideoModel.findById(videoId, {}, { lean: true });
  if (!video) {
    throw { statusCode: STATUS_CODE.NOT_FOUND, message: "Video not found." };
  }

  if (video.memberId !== memberId) {
    throw {
      statusCode: STATUS_CODE.FORBIDDEN,
      message: "You are not allowed to remove this video.",
    };
  }

  await VideoModel.deleteOne({ _id: videoId });

  console.log("OUT - removeVideoService");
};
