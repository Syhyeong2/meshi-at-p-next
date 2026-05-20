import { isAuthorizedExternalPlacesRequest } from "@/lib/external-api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type ExternalPlaceDumpRow =
  Database["public"]["Functions"]["get_external_places_dump"]["Returns"][number];

type ExternalPlaceTag = {
  id: string;
  name: string;
  emoji: string | null;
  count: number;
};

type ExternalPlace = {
  name: string;
  category: string | null;
  googlePlaceId: string;
  googleMapsUrl: string;
  avgRating: number;
  reviewCount: number;
  tags: ExternalPlaceTag[];
};

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function buildGoogleMapsUrl({ name, googlePlaceId }: { name: string; googlePlaceId: string }) {
  const params = new URLSearchParams({
    api: "1",
    query: name,
    query_place_id: googlePlaceId,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toExternalPlaceTags(tags: Json): ExternalPlaceTag[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag): ExternalPlaceTag | null => {
      if (!isRecord(tag)) {
        return null;
      }

      if (
        typeof tag.id !== "string" ||
        typeof tag.name !== "string" ||
        (tag.emoji !== null && typeof tag.emoji !== "string") ||
        typeof tag.count !== "number"
      ) {
        return null;
      }

      return {
        id: tag.id,
        name: tag.name,
        emoji: tag.emoji,
        count: tag.count,
      };
    })
    .filter((tag): tag is ExternalPlaceTag => tag !== null);
}

function toExternalPlace(row: ExternalPlaceDumpRow): ExternalPlace {
  return {
    name: row.name,
    category: row.category,
    googlePlaceId: row.google_place_id,
    googleMapsUrl: buildGoogleMapsUrl({
      name: row.name,
      googlePlaceId: row.google_place_id,
    }),
    avgRating: row.avg_rating,
    reviewCount: row.review_count,
    tags: toExternalPlaceTags(row.tags),
  };
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedExternalPlacesRequest(request)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  } catch {
    return jsonResponse({ error: "Failed to load places." }, 500);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_external_places_dump");

    if (error) {
      throw new Error("Failed to load external places dump.");
    }

    const places = (data ?? []).map(toExternalPlace);

    return jsonResponse({
      places,
      totalCount: places.length,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return jsonResponse({ error: "Failed to load places." }, 500);
  }
}
