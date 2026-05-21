"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { loginSchema, signupWithInviteSchema } from "./schema";

const DUMMY_EMAIL_DOMAIN = "example.com";

function buildDummyEmail(nickname: string): string {
  const localPart = createHash("sha256").update(nickname, "utf8").digest("hex");

  return `${localPart}@${DUMMY_EMAIL_DOMAIN}`;
}

export type AuthActionState = {
  error?: string;
  message?: string;
  fieldErrors?: {
    nickname?: string[];
    password?: string[];
    confirmPassword?: string[];
    inviteCode?: string[];
  };
  values?: {
    nickname?: string;
    inviteCode?: string;
  };
};

type LogoutActionState = {
  error?: string;
};

function readFormValue(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  return typeof value === "string" ? value : undefined;
}

function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData);
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

async function deleteCreatedUser(userId: string) {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: {
        nickname: readFormValue(formData, "nickname"),
      },
    };
  }

  const { nickname, password } = parsed.data;
  const email = buildDummyEmail(nickname);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "ニックネームまたはパスワードが正しくありません" };
  }

  revalidatePath("/", "layout");
  redirect("/home/places");
}

export async function logoutAction(): Promise<LogoutActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "ログアウトに失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/", "layout");
  redirect("/login", RedirectType.replace);
}

export async function signupWithInviteAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signupWithInviteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: {
        nickname: readFormValue(formData, "nickname"),
        inviteCode: readFormValue(formData, "inviteCode"),
      },
    };
  }

  const { password, nickname, inviteCode } = parsed.data;
  const email = buildDummyEmail(nickname);

  const admin = createAdminClient();

  const { data: existingProfile, error: checkError } = await admin
    .from("profiles")
    .select("nickname")
    .eq("nickname", nickname)
    .maybeSingle();

  if (checkError) {
    return { error: "ユーザー確認中にエラーが発生しました。" };
  }

  if (existingProfile) {
    return {
      fieldErrors: {
        nickname: ["このニックネームは既に使用されています。"],
      },
      values: {
        nickname,
        inviteCode,
      },
    };
  }

  const { data: inviteCodeRow, error: inviteCodeError } = await admin
    .from("invite_codes")
    .select("code, used_at, expires_at")
    .eq("code", inviteCode)
    .maybeSingle();

  if (inviteCodeError) {
    return { error: "招待コードの確認に失敗しました。" };
  }

  if (!inviteCodeRow) {
    return { error: "招待コードが見つかりません。" };
  }

  if (inviteCodeRow.used_at) {
    return { error: "この招待コードはすでに使用されています。" };
  }

  if (isExpired(inviteCodeRow.expires_at)) {
    return { error: "この招待コードは有効期限が切れています。" };
  }

  const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nickname,
    },
  });

  if (createUserError || !createdUserData.user) {
    return { error: "アカウント作成に失敗しました。入力内容を確認してください。" };
  }

  const userId = createdUserData.user.id;
  const { error: profileError } = await admin.rpc("consume_invite_code_and_create_profile", {
    p_code: inviteCode,
    p_user_id: userId,
    p_nickname: nickname,
  });

  if (profileError) {
    await deleteCreatedUser(userId);

    if (profileError.code === "23505") {
      return { error: "このニックネームは既に使用されています" };
    }

    if (profileError.code === "P0001") {
      return { error: "招待コードを使用できませんでした。もう一度お試しください。" };
    }

    return { error: "プロフィール作成に失敗しました。もう一度お試しください。" };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError) {
    revalidatePath("/", "layout");
    redirect("/home/places");
  }

  redirect("/login?signup=success");
}
