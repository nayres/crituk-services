import express from "express";
import request from "supertest";
import Joi from "joi";
import { validateRequest } from "../validateRequest";

const app = express();
app.use(express.json());

const schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().min(18).required(),
});

app.post("/test", validateRequest(schema), (req, res) => {
  res.status(200).json({ message: "Request is valid" });
});

describe("ValidateRequest - middleware", () => {
  it("should pass with valid input", async () => {
    const response = await request(app)
      .post("/test")
      .send({ name: "Pat Doe", age: 25 })
      .expect(200);

    expect(response.body).toEqual({ message: "Request is valid" });
  });

  it("should return 400 with missing fields", async () => {
    const response = await request(app)
      .post("/test")
      .send({ name: "Pat Doe" })
      .expect(400);

    expect(response.body.message).toBe("Validation error");
    expect(response.body.details).toContain('"age" is required');
  });

  it("should return 400 for invalid field types", async () => {
    const response = await request(app)
      .post("/test")
      .send({ name: "Pat Doe", age: "twenty-five" })
      .expect(400);

    expect(response.body.message).toBe("Validation error");
    expect(response.body.details).toContain('"age" must be a number');
  });

  it("should return 400 for invalid field values", async () => {
    const response = await request(app)
      .post("/test")
      .send({ name: "Pat Doe", age: 17 })
      .expect(400);

    expect(response.body.message).toBe("Validation error");
    expect(response.body.details).toContain(
      '"age" must be greater than or equal to 18'
    );
  });
});
