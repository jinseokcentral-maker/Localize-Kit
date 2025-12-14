import { getErrorMessage } from "~/lib/api/apiWrapper";

export type TeamLoginErrorAction =
  | { kind: "team_not_member"; modalMessage: string }
  | { kind: "invalid_team_id"; toastMessage: string }
  | { kind: "unknown" };

function getStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  // If we used preserveError, status may be in originalError
  if ("originalError" in error) {
    const original = (error as any).originalError;
    if (original && typeof original === "object" && "statusCode" in original) {
      const sc = (original as any).statusCode;
      return typeof sc === "number" ? sc : null;
    }
  }

  if ("statusCode" in error) {
    const sc = (error as any).statusCode;
    return typeof sc === "number" ? sc : null;
  }

  return null;
}

/**
 * Maps backend /auth/login errors (teamId login) into UI actions.
 */
export function getTeamLoginErrorAction(error: unknown): TeamLoginErrorAction {
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error, "");

  // Some backends may return 400 for this case; message is the most reliable signal.
  if (message.includes("User is not a member of team")) {
    return {
      kind: "team_not_member",
      modalMessage:
        "Your access to this team has not been approved yet, or you are not a member.",
    };
  }

  // Invalid team id: show toast and send user to landing (no redirect context left behind)
  if ((statusCode === 400 || statusCode === 403 || statusCode === 404) && message.includes("Invalid team ID")) {
    return { kind: "invalid_team_id", toastMessage: "Invalid login attempt." };
  }

  return { kind: "unknown" };
}


