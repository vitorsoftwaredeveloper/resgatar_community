import mongoose, { Schema } from "mongoose";
import * as dbModule from "../../../src/db";
import { createInstanceMongoose } from "../../../src/repositories/mongoose";

interface IDoc { name: string; value: number }
const schema = new Schema<IDoc>({ name: String, value: Number });

describe("createInstanceMongoose", () => {
  let dbSpy: jest.SpyInstance;
  let repo: ReturnType<typeof createInstanceMongoose<IDoc>>;
  let MongooseModel: mongoose.Model<IDoc>;

  beforeEach(() => {
    dbSpy = jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    // delete cached model so each test suite gets a fresh one
    if (mongoose.models["unitTestDoc"]) delete mongoose.models["unitTestDoc"];
    repo = createInstanceMongoose<IDoc>("unitTestDoc", schema);

    MongooseModel = mongoose.model<IDoc>("unitTestDoc");
  });

  afterEach(() => jest.restoreAllMocks());

  describe("db() is called before every operation", () => {
    beforeEach(() => {
      jest.spyOn(MongooseModel.prototype, "save").mockResolvedValue({} as any);
      jest.spyOn(MongooseModel, "insertMany").mockResolvedValue([] as any);
      jest.spyOn(MongooseModel, "updateOne").mockResolvedValue({} as any);
      jest.spyOn(MongooseModel, "updateMany").mockResolvedValue({} as any);
      jest.spyOn(MongooseModel, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(null) } as any);
      jest.spyOn(MongooseModel, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);
      jest.spyOn(MongooseModel, "findById").mockReturnValue({ lean: jest.fn().mockResolvedValue(null) } as any);
      jest.spyOn(MongooseModel, "deleteOne").mockResolvedValue({} as any);
      jest.spyOn(MongooseModel, "deleteMany").mockResolvedValue({} as any);
      jest.spyOn(MongooseModel, "countDocuments").mockResolvedValue(0 as any);
    });

    it.each([
      ["insertOne",  (r: any) => r.insertOne({ name: "x", value: 1 })],
      ["insertMany", (r: any) => r.insertMany([{ name: "x", value: 1 }])],
      ["updateOne",  (r: any) => r.updateOne({ name: "x" }, { value: 2 })],
      ["updateMany", (r: any) => r.updateMany({ name: "x" }, { value: 2 })],
      ["findOne",    (r: any) => r.findOne({ name: "x" })],
      ["find",       (r: any) => r.find({ name: "x" })],
      ["findById",   (r: any) => r.findById("some-id")],
      ["deleteOne",  (r: any) => r.deleteOne({ name: "x" })],
      ["deleteMany", (r: any) => r.deleteMany({ name: "x" })],
      ["count",      (r: any) => r.count({ name: "x" })],
    ])("%s calls db() first", async (_, call) => {
      await call(repo);
      expect(dbSpy).toHaveBeenCalled();
    });
  });

  describe("insertOne", () => {
    it("should call document.save()", async () => {
      const saveSpy = jest.spyOn(MongooseModel.prototype, "save").mockResolvedValue({} as any);

      await repo.insertOne({ name: "test", value: 1 });

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it("should forward options to save()", async () => {
      const saveSpy = jest.spyOn(MongooseModel.prototype, "save").mockResolvedValue({} as any);
      const session = {} as any;

      await repo.insertOne({ name: "x", value: 1 }, { session });

      expect(saveSpy).toHaveBeenCalledWith({ session });
    });
  });

  describe("insertMany", () => {
    it("should call model.insertMany with data and options", async () => {
      const spy = jest.spyOn(MongooseModel, "insertMany").mockResolvedValue([] as any);
      const docs = [{ name: "a", value: 1 }, { name: "b", value: 2 }];

      await repo.insertMany(docs);

      expect(spy).toHaveBeenCalledWith(docs, {});
    });
  });

  describe("updateOne", () => {
    it("should call model.updateOne with filter, data and options", async () => {
      const spy = jest.spyOn(MongooseModel, "updateOne").mockResolvedValue({} as any);

      await repo.updateOne({ name: "x" }, { value: 99 }, { upsert: true });

      expect(spy).toHaveBeenCalledWith({ name: "x" }, { value: 99 }, { upsert: true });
    });
  });

  describe("updateMany", () => {
    it("should call model.updateMany with filter, data and options", async () => {
      const spy = jest.spyOn(MongooseModel, "updateMany").mockResolvedValue({} as any);

      await repo.updateMany({ value: 0 }, { value: 1 });

      expect(spy).toHaveBeenCalledWith({ value: 0 }, { value: 1 }, {});
    });
  });

  describe("findOne", () => {
    it("should call model.findOne with filter and projection", async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      const spy = jest.spyOn(MongooseModel, "findOne").mockReturnValue({ lean: leanMock } as any);

      await repo.findOne({ name: "x" }, { name: 1 });

      expect(spy).toHaveBeenCalledWith({ name: "x" }, { name: 1 }, {});
    });

    it("should call .lean() to return plain object", async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(MongooseModel, "findOne").mockReturnValue({ lean: leanMock } as any);

      await repo.findOne({ name: "x" });

      expect(leanMock).toHaveBeenCalled();
    });
  });

  describe("find", () => {
    it("should call model.find with filter and projection", async () => {
      const leanMock = jest.fn().mockResolvedValue([]);
      const spy = jest.spyOn(MongooseModel, "find").mockReturnValue({ lean: leanMock } as any);

      await repo.find({ value: 1 }, { name: 1 });

      expect(spy).toHaveBeenCalledWith({ value: 1 }, { name: 1 }, undefined);
    });

    it("should call .lean() to return plain objects", async () => {
      const leanMock = jest.fn().mockResolvedValue([]);
      jest.spyOn(MongooseModel, "find").mockReturnValue({ lean: leanMock } as any);

      await repo.find({});

      expect(leanMock).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should call model.findById with id and projection", async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      const spy = jest.spyOn(MongooseModel, "findById").mockReturnValue({ lean: leanMock } as any);

      await repo.findById("doc-id-123", { name: 1 });

      expect(spy).toHaveBeenCalledWith("doc-id-123", { name: 1 }, {});
    });

    it("should call .lean() to return plain object", async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(MongooseModel, "findById").mockReturnValue({ lean: leanMock } as any);

      await repo.findById("doc-id-123");

      expect(leanMock).toHaveBeenCalled();
    });
  });

  describe("deleteOne", () => {
    it("should call model.deleteOne with filter and options", async () => {
      const spy = jest.spyOn(MongooseModel, "deleteOne").mockResolvedValue({} as any);

      await repo.deleteOne({ name: "x" });

      expect(spy).toHaveBeenCalledWith({ name: "x" }, {});
    });
  });

  describe("deleteMany", () => {
    it("should call model.deleteMany with filter and options", async () => {
      const spy = jest.spyOn(MongooseModel, "deleteMany").mockResolvedValue({} as any);

      await repo.deleteMany({ value: 0 });

      expect(spy).toHaveBeenCalledWith({ value: 0 }, {});
    });
  });

  describe("count", () => {
    it("should call model.countDocuments with filter and options", async () => {
      const spy = jest.spyOn(MongooseModel, "countDocuments").mockResolvedValue(5 as any);

      await repo.count({ name: "x" });

      expect(spy).toHaveBeenCalledWith({ name: "x" }, {});
    });
  });

  describe("model reuse", () => {
    it("should reuse existing model when called twice with same modelName", () => {
      expect(() => {
        createInstanceMongoose<IDoc>("unitTestDoc", schema);
      }).not.toThrow();
    });
  });
});
