import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as createVideoServiceModule from "../../../../src/services/videos/createVideo";
import { execute } from "../../../../src/handlers/videos/createVideo";

const validPayload = { url: "https://www.youtube.com/watch?v=dQw4w9WgXcW" };
const mockVideoResponse = { _id: "video-id-123", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcW/hqdefault.jpg" };

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return { body: JSON.stringify(body), headers: { authorization: token } } as any;
}

describe("createVideo handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let createVideoServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    createVideoServiceSpy = jest
      .spyOn(createVideoServiceModule, "createVideoService")
      .mockResolvedValue(mockVideoResponse);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return 201 and video data on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("video-id-123");
    expect(body.data.thumbnail).toBeDefined();
  });

  it("should call createVideoService with member sub, url and title", async () => {
    await execute(buildEvent(validPayload));

    expect(createVideoServiceSpy).toHaveBeenCalledWith("member-id-123", validPayload.url, undefined);
  });

  it("should pass title to createVideoService when provided", async () => {
    await execute(buildEvent({ ...validPayload, title: "My Video Title" }));

    expect(createVideoServiceSpy).toHaveBeenCalledWith("member-id-123", validPayload.url, "My Video Title");
  });

  it("should return 400 when url is missing", async () => {
    const result = await execute(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(createVideoServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when url is not a YouTube URL", async () => {
    const result = await execute(buildEvent({ url: "https://vimeo.com/123456" }));

    expect(result.statusCode).toBe(400);
    expect(createVideoServiceSpy).not.toHaveBeenCalled();
  });

  it("should accept youtu.be short URLs", async () => {
    const result = await execute(buildEvent({ url: "https://youtu.be/dQw4w9WgXcW" }));

    expect(result.statusCode).toBe(201);
  });

  it("should accept youtube.com/shorts/ URLs", async () => {
    const result = await execute(buildEvent({ url: "https://www.youtube.com/shorts/dQw4w9WgXcW" }));

    expect(result.statusCode).toBe(201);
  });

  it("should return 400 when additional properties are sent", async () => {
    const result = await execute(buildEvent({ ...validPayload, extra: "field" }));

    expect(result.statusCode).toBe(400);
  });

  it("should return 500 when service throws unexpected error", async () => {
    createVideoServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });
});
