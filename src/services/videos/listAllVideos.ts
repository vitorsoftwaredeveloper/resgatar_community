import { VideoModel } from "../../models/Video";
import { MemberModel } from "../../models/Member";
import { IPaginatedVideos } from "../../types/videos";
import { buildThumbnailUrl } from "../../utils/youtube";
import { escapeRegExp } from "../../utils/helper";

interface VideoFilters {
  title?: string;
  memberId?: string;
}

export const listAllVideosService = async (
  page: number,
  limit: number,
  filters: VideoFilters = {},
): Promise<IPaginatedVideos> => {
  console.log("IN - listAllVideosService");

  const skip = (page - 1) * limit;

  const query = {
    ...(filters.title && {
      title: { $regex: escapeRegExp(filters.title), $options: "i" },
    }),
    ...(filters.memberId && { memberId: filters.memberId }),
  };
  console.log("Mongo query:", JSON.stringify(query));
  console.log("Mongo options:", JSON.stringify({ skip, limit, sort: { createdAt: -1 } }));

  const [videos, total] = await Promise.all([
    VideoModel.find(
      query,
      { _id: 1, memberId: 1, url: 1, videoId: 1, title: 1 },
      { sort: { createdAt: -1 }, skip, limit, lean: true },
    ),
    VideoModel.count(query),
  ]);

  const totalPages = Math.ceil(total / limit);
  console.log("Videos found:", JSON.stringify({ returned: videos.length, total, totalPages }));

  if (videos.length === 0) {
    console.log("OUT - listAllVideosService");
    return { items: [], page, limit, total, totalPages };
  }

  const memberIds = Array.from(new Set(videos.map((v) => v.memberId)));
  console.log("Member IDs to resolve:", JSON.stringify(memberIds));

  const members = await MemberModel.find(
    { _id: { $in: memberIds } },
    { _id: 1, firstName: 1, lastName: 1, profileImage: 1 },
    { lean: true },
  );
  console.log("Members found:", members.length);

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

  const items = videos
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

  return { items, page, limit, total, totalPages };
};
