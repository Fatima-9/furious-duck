const errorMiddleware = require("../../middlewares/errorMiddleware");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("errorMiddleware", () => {
  test("returns the provided application error", () => {
    const res = createResponse();

    errorMiddleware({ statusCode: 400, message: "bad request" }, {}, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "bad request",
    });
  });

  test("maps duplicate database errors to 409", () => {
    const res = createResponse();

    errorMiddleware({ code: "23505", message: "duplicate" }, {}, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "resource already exists",
    });
  });

  test("maps invalid foreign keys to 400", () => {
    const res = createResponse();

    errorMiddleware({ code: "23503", message: "invalid relation" }, {}, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "invalid related resource",
    });
  });

  test("hides unexpected server error messages", () => {
    const res = createResponse();

    errorMiddleware({ message: "secret stack trace" }, {}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });
  });
});
