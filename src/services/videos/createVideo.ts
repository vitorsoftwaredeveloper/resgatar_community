import { v4 as uuidv4 } from "uuid";
import { VideoModel } from "../../models/Video";
import { IVideo } from "../../types/videos";
import { STATUS_CODE } from "../../constants";
import { extractVideoId, buildThumbnailUrl } from "../../utils/youtube";

export const createVideoService = async (
  memberId: string,
  url: string,
  title?: string,
): Promise<{ _id: string; thumbnail: string }> => {
  console.log("IN - createVideoService");

  const videoId = extractVideoId(url);
  if (!videoId) {
    throw {
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "URL do YouTube inválida.",
    };
  }

  const video: IVideo = {
    _id: uuidv4(),
    memberId,
    url,
    videoId,
    ...(title ? { title } : {}),
  };

  await VideoModel.insertOne(video);

  console.log("OUT - createVideoService");
  return { _id: video._id, thumbnail: buildThumbnailUrl(videoId) };
};
