import "server-only";

import { timingSafeEqual } from "node:crypto";

const EXTERNAL_PLACES_API_KEY_ENV = "EXTERNAL_PLACES_API_KEY";

function getRequiredExternalPlacesApiKey(): string {
  const apiKey = process.env[EXTERNAL_PLACES_API_KEY_ENV];

  if (!apiKey) {
    throw new Error(`Missing required environment variable: ${EXTERNAL_PLACES_API_KEY_ENV}`);
  }

  return apiKey;
}

function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    return null;
  }

  return token;
}

function timingSafeStringEqual(leftValue: string, rightValue: string): boolean {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  const maxLength = Math.max(left.length, right.length);
  const paddedLeft = Buffer.alloc(maxLength);
  const paddedRight = Buffer.alloc(maxLength);

  left.copy(paddedLeft);
  right.copy(paddedRight);

  return timingSafeEqual(paddedLeft, paddedRight) && left.length === right.length;
}

export function isAuthorizedExternalPlacesRequest(request: Request): boolean {
  const expectedApiKey = getRequiredExternalPlacesApiKey();
  const providedApiKey = getBearerToken(request.headers.get("authorization"));

  return Boolean(providedApiKey && timingSafeStringEqual(providedApiKey, expectedApiKey));
}
