import * as helperService from "../../../../src/services/helper";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import { createNotificationService } from "../../../../src/services/notifications/createNotification";
import { INotification } from "../../../../src/types/notification";

const validNotification: INotification = {
  title: "Aviso importante",
  description: "Reunião geral neste sábado às 10h.",
};

describe("createNotificationService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let sendPushNotificationToAllSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    sendPushNotificationToAllSpy = jest
      .spyOn(firebaseIntegration, "sendPushNotificationToAll")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify admin before sending notification", async () => {
    await createNotificationService("admin-id", validNotification);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should throw when caller is not admin", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      createNotificationService("user-id", validNotification)
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(sendPushNotificationToAllSpy).not.toHaveBeenCalled();
  });

  it("should call sendPushNotificationToAll with correct title and description", async () => {
    await createNotificationService("admin-id", validNotification);

    expect(sendPushNotificationToAllSpy).toHaveBeenCalledWith(
      validNotification.title,
      validNotification.description
    );
  });

  it("should NOT call Firebase when admin verification fails", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      createNotificationService("user-id", validNotification)
    ).rejects.toBeDefined();

    expect(sendPushNotificationToAllSpy).not.toHaveBeenCalled();
  });

  it("should throw when Firebase fails", async () => {
    sendPushNotificationToAllSpy.mockRejectedValue(new Error("Firebase error"));

    await expect(
      createNotificationService("admin-id", validNotification)
    ).rejects.toThrow("Firebase error");
  });

  it("should resolve without returning a value on success", async () => {
    const result = await createNotificationService("admin-id", validNotification);

    expect(result).toBeUndefined();
  });
});
