"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveUser } from "../auth/access";
import { nicknameSchema } from "../auth/schema";
import { createClient } from "@/lib/supabase/server";
import { getBookmarkedPlacesAction } from "../places/actions";
import { getUserReviewsAction } from "../review/actions";
import { Place, PlaceReview } from "../places/types";

const DUMMY_EMAIL_DOMAIN = "example.com";

function buildDummyEmail(nickname: string): string {
  const localPart = createHash("sha256").update(nickname, "utf8").digest("hex");

  return `${localPart}@${DUMMY_EMAIL_DOMAIN}`;
}

export type UserProfileData = {
  stats: {
    reviews: number;
    bookmarks: number;
  };
  recentBookmarks: Place[];
  recentReviews: PlaceReview[];
};

export async function getUserProfileStatsAction() {
  const user = await requireActiveUser();
  const supabase = await createClient();

  const [reviewsCountResult, bookmarksCountResult, bookmarkedPlaces, myReviews] = await Promise.all(
    [
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.userId),
      supabase
        .from("place_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.userId),
      getBookmarkedPlacesAction(3),
      getUserReviewsAction(3),
    ]
  );

  return {
    user,
    stats: {
      reviews: reviewsCountResult.count ?? 0,
      bookmarks: bookmarksCountResult.count ?? 0,
    },
    bookmarkedPlaces,
    myReviews,
  };
}
export type ProfileActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  fieldErrors?: {
    nickname?: string[];
  };
  values?: {
    nickname?: string;
  };
};

export async function updateNicknameAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireActiveUser();
  const rawNickname = formData.get("nickname");
  const nickname = typeof rawNickname === "string" ? rawNickname.trim() : "";

  const parsed = nicknameSchema.safeParse(nickname);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: {
        nickname: parsed.error.flatten().formErrors,
      },
      values: { nickname },
    };
  }

  const newNickname = parsed.data;

  if (newNickname === user.nickname) {
    return {
      success: true,
      message: "ニックネームを更新しました。",
    };
  }

  const admin = createAdminClient();

  const { data: existingProfile, error: checkError } = await admin
    .from("profiles")
    .select("id")
    .eq("nickname", newNickname)
    .maybeSingle();

  if (checkError) {
    return {
      error: "ユーザー確認中にエラーが発生しました。",
      values: { nickname: newNickname },
    };
  }

  if (existingProfile) {
    return {
      fieldErrors: {
        nickname: ["このニックネームは既に使用されています。"],
      },
      values: { nickname: newNickname },
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ nickname: newNickname })
    .eq("id", user.userId);

  if (profileError) {
    return {
      error: "プロフィールの更新に失敗しました。",
      values: { nickname: newNickname },
    };
  }

  const newEmail = buildDummyEmail(newNickname);
  const { error: authError } = await admin.auth.admin.updateUserById(user.userId, {
    email: newEmail,
    user_metadata: { nickname: newNickname },
    email_confirm: true,
  });

  if (authError) {
    await admin.from("profiles").update({ nickname: user.nickname }).eq("id", user.userId);

    return {
      error: "認証情報の更新に失敗しました。",
      values: { nickname: newNickname },
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    message: "ニックネームを更新しました。",
  };
}
