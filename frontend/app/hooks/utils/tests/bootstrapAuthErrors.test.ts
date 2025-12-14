import { describe, it, expect } from "vitest";
import { getTeamLoginErrorAction } from "../bootstrapAuthErrors";

describe("getTeamLoginErrorAction", () => {
  it("maps 403 not-a-member to modal action", () => {
    const error = {
      statusCode: 403,
      message: "User is not a member of team 123",
    };

    const action = getTeamLoginErrorAction(error);
    expect(action.kind).toBe("team_not_member");
  });

  it("maps 400 not-a-member to modal action (message-based)", () => {
    const error = {
      statusCode: 400,
      message: "User is not a member of team 123",
    };

    const action = getTeamLoginErrorAction(error);
    expect(action.kind).toBe("team_not_member");
  });

  it("maps 400 invalid team id to toast action", () => {
    const error = {
      statusCode: 400,
      message: "Invalid team ID: 123",
    };

    const action = getTeamLoginErrorAction(error);
    expect(action.kind).toBe("invalid_team_id");
  });

  it("supports preserveError(originalError) shape", () => {
    const error = {
      message: "wrapper",
      originalError: { statusCode: 400, message: "Invalid team ID: 123" },
    };

    const action = getTeamLoginErrorAction(error);
    expect(action.kind).toBe("invalid_team_id");
  });

  it("returns unknown for other errors", () => {
    const action = getTeamLoginErrorAction(new Error("boom"));
    expect(action.kind).toBe("unknown");
  });
});


