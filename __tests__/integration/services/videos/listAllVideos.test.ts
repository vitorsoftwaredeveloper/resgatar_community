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
  let videoCountSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;

  beforeEach(() => {
    videoFindSpy = jest.spyOn(VideoModel, "find").mockResolvedValue(mockVideos as any);
    videoCountSpy = jest.spyOn(VideoModel, "count").mockResolvedValue(2 as any);
    memberFindSpy = jest.spyOn(MemberModel, "find").mockResolvedValue(mockMembers as any);
    jest.spyOn(youtubeUtil, "buildThumbnailUrl").mockImplementation(
      (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return a page of videos with member data joined", async () => {
    const result = await listAllVideosService(1, 20);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      _id: "v1",
      memberId: "m1",
      firstName: "João",
      lastName: "Silva",
      profileImage: "base64data",
      title: "My Video",
    });
    expect(result.items[1]).toMatchObject({
      _id: "v2",
      memberId: "m2",
      firstName: "Maria",
      lastName: "Souza",
      profileImage: null,
    });
  });

  it("should return pagination metadata", async () => {
    videoCountSpy.mockResolvedValue(45 as any);

    const result = await listAllVideosService(2, 20);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);
  });

  it("should return empty items when no videos exist on the page", async () => {
    videoFindSpy.mockResolvedValue([]);
    videoCountSpy.mockResolvedValue(0 as any);

    const result = await listAllVideosService(1, 20);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(memberFindSpy).not.toHaveBeenCalled();
  });

  it("should filter out videos whose member was deleted", async () => {
    memberFindSpy.mockResolvedValue([mockMembers[0]] as any);

    const result = await listAllVideosService(1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].memberId).toBe("m1");
  });

  it("should include thumbnail URL for each video", async () => {
    const result = await listAllVideosService(1, 20);

    expect(result.items[0].thumbnail).toBe("https://img.youtube.com/vi/abc1234abcd/hqdefault.jpg");
    expect(result.items[1].thumbnail).toBe("https://img.youtube.com/vi/xyz5678efgh/hqdefault.jpg");
  });

  it("should not include title when video has no title", async () => {
    const result = await listAllVideosService(1, 20);

    expect(result.items[1].title).toBeUndefined();
  });

  it("should query videos sorted by createdAt descending with skip/limit", async () => {
    await listAllVideosService(3, 10);

    expect(videoFindSpy).toHaveBeenCalledWith(
      {},
      expect.any(Object),
      expect.objectContaining({ sort: { createdAt: -1 }, skip: 20, limit: 10 }),
    );
  });

  it("should deduplicate member IDs in the members query", async () => {
    videoFindSpy.mockResolvedValue([
      { _id: "v1", memberId: "m1", videoId: "abc1234abcd" },
      { _id: "v2", memberId: "m1", videoId: "xyz5678efgh" },
    ] as any);
    memberFindSpy.mockResolvedValue([mockMembers[0]] as any);

    await listAllVideosService(1, 20);

    const queriedIds = memberFindSpy.mock.calls[0][0]._id.$in;
    expect(queriedIds).toHaveLength(1);
    expect(queriedIds).toContain("m1");
  });

  it("should throw when VideoModel.find fails", async () => {
    videoFindSpy.mockRejectedValue(new Error("DB error"));

    await expect(listAllVideosService(1, 20)).rejects.toThrow("DB error");
  });

  it("should filter by title using a case-insensitive regex", async () => {
    await listAllVideosService(1, 20, { title: "My" });

    const expectedQuery = { title: { $regex: "My", $options: "i" } };
    expect(videoFindSpy).toHaveBeenCalledWith(
      expectedQuery,
      expect.any(Object),
      expect.any(Object),
    );
    expect(videoCountSpy).toHaveBeenCalledWith(expectedQuery);
  });

  it("should escape regex special characters in the title filter", async () => {
    await listAllVideosService(1, 20, { title: "a.b*c" });

    expect(videoFindSpy).toHaveBeenCalledWith(
      { title: { $regex: "a\\.b\\*c", $options: "i" } },
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should filter by memberId", async () => {
    await listAllVideosService(1, 20, { memberId: "m1" });

    const expectedQuery = { memberId: "m1" };
    expect(videoFindSpy).toHaveBeenCalledWith(
      expectedQuery,
      expect.any(Object),
      expect.any(Object),
    );
    expect(videoCountSpy).toHaveBeenCalledWith(expectedQuery);
  });

  it("should combine title and memberId filters", async () => {
    await listAllVideosService(1, 20, { title: "My", memberId: "m1" });

    expect(videoFindSpy).toHaveBeenCalledWith(
      { title: { $regex: "My", $options: "i" }, memberId: "m1" },
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should query without filters when none are given", async () => {
    await listAllVideosService(1, 20);

    expect(videoFindSpy).toHaveBeenCalledWith(
      {},
      expect.any(Object),
      expect.any(Object),
    );
    expect(videoCountSpy).toHaveBeenCalledWith({});
  });
});
