import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as listAllVideosServiceModule from "../../../../src/services/videos/listAllVideos";
import { execute } from "../../../../src/handlers/videos/listAllVideos";

const REQUESTER_ID = "member-id-123";

const mockPaginatedVideos = {
  items: [
    {
      _id: "v1",
      memberId: "m1",
      videoId: "abc1234abcd",
      thumbnail: "https://img.youtube.com/vi/abc1234abcd/hqdefault.jpg",
      url: "https://youtu.be/abc1234abcd",
      firstName: "João",
      lastName: "Silva",
      profileImage: null,
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

function buildEvent(
  queryStringParameters: Record<string, string> | null = null,
): APIGatewayEvent {
  return {
    body: null,
    headers: { authorization: "Bearer valid.token.here" },
    queryStringParameters,
  } as any;
}

describe("listAllVideos handler (integration)", () => {
  let listAllVideosSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(helperUtil, "decodeToken").mockReturnValue({ sub: REQUESTER_ID } as any);
    listAllVideosSpy = jest
      .spyOn(listAllVideosServiceModule, "listAllVideosService")
      .mockResolvedValue(mockPaginatedVideos as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return 200 with the paginated videos list", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]._id).toBe("v1");
    expect(body.data).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it("should default to page 1 and limit 20 when no query params are given", async () => {
    await execute(buildEvent());

    expect(listAllVideosSpy).toHaveBeenCalledWith(REQUESTER_ID, 1, 20, {});
  });

  it("should use page and limit from query params", async () => {
    await execute(buildEvent({ page: "3", limit: "10" }));

    expect(listAllVideosSpy).toHaveBeenCalledWith(REQUESTER_ID, 3, 10, {});
  });

  it("should pass title filter from query params", async () => {
    await execute(buildEvent({ title: "My Video" }));

    expect(listAllVideosSpy).toHaveBeenCalledWith(REQUESTER_ID, 1, 20, { title: "My Video" });
  });

  it("should pass memberId filter from query params", async () => {
    await execute(buildEvent({ memberId: "m1" }));

    expect(listAllVideosSpy).toHaveBeenCalledWith(REQUESTER_ID, 1, 20, { memberId: "m1" });
  });

  it("should pass both title and memberId filters together", async () => {
    await execute(buildEvent({ title: "My Video", memberId: "m1" }));

    expect(listAllVideosSpy).toHaveBeenCalledWith(REQUESTER_ID, 1, 20, {
      title: "My Video",
      memberId: "m1",
    });
  });

  it("should ignore blank title/memberId query params", async () => {
    await execute(buildEvent({ title: "   ", memberId: "" }));

    expect(listAllVideosSpy).toHaveBeenCalledWith(REQUESTER_ID, 1, 20, {});
  });

  it("should return 400 when page is invalid", async () => {
    const result = await execute(buildEvent({ page: "0" }));

    expect(result.statusCode).toBe(400);
    expect(listAllVideosSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when limit exceeds the max allowed", async () => {
    const result = await execute(buildEvent({ limit: "100" }));

    expect(result.statusCode).toBe(400);
    expect(listAllVideosSpy).not.toHaveBeenCalled();
  });

  it("should return 200 with empty items when no videos exist", async () => {
    listAllVideosSpy.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.items).toHaveLength(0);
  });

  it("should return 500 when service throws", async () => {
    listAllVideosSpy.mockRejectedValue(new Error("DB failure"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });

  it("should call listAllVideosService once", async () => {
    await execute(buildEvent());

    expect(listAllVideosSpy).toHaveBeenCalledTimes(1);
  });
});
