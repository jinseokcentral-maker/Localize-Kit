// Centralized app error types (Effect-friendly tagged errors)

export type TaggedError<T extends string> = {
  _tag: T;
  message: string;
  cause?: unknown;
};

export type AuthNotReadyError = TaggedError<"AuthNotReadyError">;
export type AuthRequiredError = TaggedError<"AuthRequiredError">;

export type ProfileFetchError = TaggedError<"ProfileFetchError">;
export type ProfileNotFoundError = TaggedError<"ProfileNotFoundError">;
export type ProfileUpsertError = TaggedError<"ProfileUpsertError">;

export type ApiError =
  | AuthNotReadyError
  | AuthRequiredError
  | ProfileFetchError
  | ProfileNotFoundError
  | ProfileUpsertError;

