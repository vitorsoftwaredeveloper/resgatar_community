import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as removeVideoServiceModule from "../../../../src/services/videos/removeVideo";
import { execute } from "../../../../src/handlers/videos/removeVideo";

function buildEvent(videoId?: string, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    pathParameters: videoId ? { videoId } : null,
    headers: { authorization: token },
  } as any;
}

describe("removeVideo handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let removeVideoServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    removeVideoServiceSpy = jest
      .spyOn(removeVideoServiceModule, "removeVideoService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return 204 on success", async () => {
    const result = await execute(buildEvent("video-id-123"));

    expect(result.statusCode).toBe(204);
  });

  it("should call removeVideoService with member sub and videoId", async () => {
    await execute(buildEvent("video-id-123"));

    expect(removeVideoServiceSpy).toHaveBeenCalledWith("member-id-123", "video-id-123");
  });

  it("should return 400 when videoId path param is missing", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(400);
    expect(removeVideoServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when video is not found", async () => {
    removeVideoServiceSpy.mockRejectedValue({ statusCode: 404, message: "Video not found." });

    const result = await execute(buildEvent("video-id-123"));

    expect(result.statusCode).toBe(404);
  });

  it("should return 403 when member does not own the video", async () => {
    removeVideoServiceSpy.mockRejectedValue({
      statusCode: 403,
      message: "You are not allowed to remove this video.",
    });

    const result = await execute(buildEvent("video-id-123"));

    expect(result.statusCode).toBe(403);
  });

  it("should return 500 when service throws unexpected error", async () => {
    removeVideoServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent("video-id-123"));

    expect(result.statusCode).toBe(500);
  });
});
