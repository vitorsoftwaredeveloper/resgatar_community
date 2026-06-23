import { VideoModel } from "../../models/Video";
import { MemberModel } from "../../models/Member";
import { IVideoWithMember } from "../../types/videos";
import { buildThumbnailUrl } from "../../utils/youtube";

export const listAllVideosService = async (): Promise<IVideoWithMember[]> => {
  console.log("IN - listAllVideosService");

  const videos = await VideoModel.find(
    {},
    { _id: 1, memberId: 1, url: 1, videoId: 1, title: 1 },
    { sort: { createdAt: -1 }, lean: true },
  );

  if (videos.length === 0) {
    console.log("OUT - listAllVideosService");
    return [];
  }

  const memberIds = Array.from(new Set(videos.map((v) => v.memberId)));

  const members = await MemberModel.find(
    { _id: { $in: memberIds } },
    { _id: 1, firstName: 1, lastName: 1, profileImage: 1 },
    { lean: true },
  );

  const memberMap = new Map(
    members.map((m: any) => [
      m._id,
      {
        firstName: m.firstName,
        lastName: m.lastName,
        profileImage: m.profileImage ?? null,
      },
    ]),
  );

  console.log("OUT - listAllVideosService");

  return videos
    .filter((v) => memberMap.has(v.memberId))
    .map((v) => {
      const member = memberMap.get(v.memberId)!;
      return {
        _id: v._id,
        memberId: v.memberId,
        videoId: v.videoId,
        thumbnail: buildThumbnailUrl(v.videoId),
        url: v.url,
        ...(v.title ? { title: v.title } : {}),
        firstName: member.firstName,
        lastName: member.lastName,
        profileImage: member.profileImage,
      };
    });
};
