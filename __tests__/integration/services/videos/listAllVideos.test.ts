import { VideoModel } from "../../../../src/models/Video";
import { MemberModel } from "../../../../src/models/Member";
import * as youtubeUtil from "../../../../src/utils/youtube";
import { listAllVideosService } from "../../../../src/services/videos/listAllVideos";

const mockVideos = [
  { _id: "v1", memberId: "m1", url: "https://youtu.be/abc1234abcd", videoId: "abc1234abcd", title: "My Video" },
  { _id: "v2", memberId: "m2", url: "https://youtu.be/xyz5678efgh", videoId: "xyz5678efgh" },
];

const mockMembers = [
  { _id: "m1", firstName: "João", lastName: "Silva", profileImage: "base64data" },
  { _id: "m2", firstName: "Maria", lastName: "Souza", profileImage: null },
];

describe("listAllVideosService (integration)", () => {
  let videoFindSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;

  beforeEach(() => {
    videoFindSpy = jest.spyOn(VideoModel, "find").mockResolvedValue(mockVideos as any);
    memberFindSpy = jest.spyOn(MemberModel, "find").mockResolvedValue(mockMembers as any);
    jest.spyOn(youtubeUtil, "buildThumbnailUrl").mockImplementation(
      (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return all videos with member data joined", async () => {
    const result = await listAllVideosService();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      _id: "v1",
      memberId: "m1",
      firstName: "João",
      lastName: "Silva",
      profileImage: "base64data",
      title: "My Video",
    });
    expect(result[1]).toMatchObject({
      _id: "v2",
      memberId: "m2",
      firstName: "Maria",
      lastName: "Souza",
      profileImage: null,
    });
  });

  it("should return empty array when no videos exist", async () => {
    videoFindSpy.mockResolvedValue([]);

    const result = await listAllVideosService();

    expect(result).toHaveLength(0);
    expect(memberFindSpy).not.toHaveBeenCalled();
  });

  it("should filter out videos whose member was deleted", async () => {
    memberFindSpy.mockResolvedValue([mockMembers[0]] as any);

    const result = await listAllVideosService();

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe("m1");
  });

  it("should include thumbnail URL for each video", async () => {
    const result = await listAllVideosService();

    expect(result[0].thumbnail).toBe("https://img.youtube.com/vi/abc1234abcd/hqdefault.jpg");
    expect(result[1].thumbnail).toBe("https://img.youtube.com/vi/xyz5678efgh/hqdefault.jpg");
  });

  it("should not include title when video has no title", async () => {
    const result = await listAllVideosService();

    expect(result[1].title).toBeUndefined();
  });

  it("should query videos sorted by createdAt descending", async () => {
    await listAllVideosService();

    expect(videoFindSpy).toHaveBeenCalledWith(
      {},
      expect.any(Object),
      expect.objectContaining({ sort: { createdAt: -1 } }),
    );
  });

  it("should deduplicate member IDs in the members query", async () => {
    videoFindSpy.mockResolvedValue([
      { _id: "v1", memberId: "m1", videoId: "abc1234abcd" },
      { _id: "v2", memberId: "m1", videoId: "xyz5678efgh" },
    ] as any);
    memberFindSpy.mockResolvedValue([mockMembers[0]] as any);

    await listAllVideosService();

    const queriedIds = memberFindSpy.mock.calls[0][0]._id.$in;
    expect(queriedIds).toHaveLength(1);
    expect(queriedIds).toContain("m1");
  });

  it("should throw when VideoModel.find fails", async () => {
    videoFindSpy.mockRejectedValue(new Error("DB error"));

    await expect(listAllVideosService()).rejects.toThrow("DB error");
  });
});
