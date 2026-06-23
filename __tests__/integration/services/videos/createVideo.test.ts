import { VideoModel } from "../../../../src/models/Video";
import { createVideoService } from "../../../../src/services/videos/createVideo";

describe("createVideoService (integration)", () => {
  let insertOneSpy: jest.SpyInstance;

  beforeEach(() => {
    insertOneSpy = jest
      .spyOn(VideoModel, "insertOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should persist the video in the DB", async () => {
    await createVideoService("member-id-123", "https://www.youtube.com/watch?v=dQw4w9WgXcW");

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: "member-id-123", videoId: "dQw4w9WgXcW" }),
    );
  });

  it("should return the generated _id and thumbnail", async () => {
    const result = await createVideoService(
      "member-id-123",
      "https://www.youtube.com/watch?v=dQw4w9WgXcW",
    );

    expect(result._id).toBeDefined();
    expect(result.thumbnail).toBe("https://img.youtube.com/vi/dQw4w9WgXcW/hqdefault.jpg");
  });

  it("should extract videoId from youtu.be URL", async () => {
    await createVideoService("member-id-123", "https://youtu.be/dQw4w9WgXcW");

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "dQw4w9WgXcW" }),
    );
  });

  it("should extract videoId from youtube.com URL with extra query params", async () => {
    await createVideoService(
      "member-id-123",
      "https://www.youtube.com/watch?v=dQw4w9WgXcW&t=120",
    );

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "dQw4w9WgXcW" }),
    );
  });

  it("should throw 400 when videoId cannot be extracted from URL", async () => {
    await expect(
      createVideoService("member-id-123", "https://youtube.com/channel/UCxxx"),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(insertOneSpy).not.toHaveBeenCalled();
  });

  it("should throw when DB insert fails", async () => {
    insertOneSpy.mockRejectedValue(new Error("DB error"));

    await expect(
      createVideoService("member-id-123", "https://www.youtube.com/watch?v=dQw4w9WgXcW"),
    ).rejects.toThrow("DB error");
  });
});
