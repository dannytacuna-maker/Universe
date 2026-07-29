import { getMissionAuthorization, isSameOriginRequest } from "./mission-auth";

export type AuthorizedJarvisRequest = Readonly<{
  owner: NonNullable<
    Awaited<ReturnType<typeof getMissionAuthorization>>["owner"]
  >;
  response: null;
}>;

export type RejectedJarvisRequest = Readonly<{
  owner: null;
  response: Response;
}>;

export async function authorizeJarvisRequest(
  request: Request,
  options: Readonly<{ requireSameOrigin?: boolean }> = {},
): Promise<AuthorizedJarvisRequest | RejectedJarvisRequest> {
  if (options.requireSameOrigin && !isSameOriginRequest(request)) {
    return {
      owner: null,
      response: Response.json(
        { error: "Invalid request origin." },
        { status: 403 },
      ),
    };
  }

  const authorization = await getMissionAuthorization();

  if (!authorization.authenticated) {
    return {
      owner: null,
      response: Response.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (!authorization.owner) {
    return {
      owner: null,
      response: Response.json(
        { error: "Account not authorized." },
        { status: 403 },
      ),
    };
  }

  return { owner: authorization.owner, response: null };
}
