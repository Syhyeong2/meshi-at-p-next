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

async function clearInviteCodeUse(code: string, userId: string) {
  const admin = createAdminClient();

  await admin
    .from("invite_codes")
    .update({
      used_at: null,
      used_by: null,
    })
    .eq("code", code)
    .eq("used_by", userId);
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

  const supabase = await createClient();
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
    },
  });

  if (signupError || !signupData.user) {
    return { error: "アカウント作成に失敗しました。入力内容を確認してください。" };
  }

  const userId = signupData.user.id;
  const usedAt = new Date().toISOString();
  const { data: usedInviteCode, error: useInviteCodeError } = await admin
    .from("invite_codes")
    .update({
      used_at: usedAt,
      used_by: userId,
    })
    .eq("code", inviteCode)
    .is("used_at", null)
    .gt("expires_at", usedAt)
    .select("code")
    .maybeSingle();

  if (useInviteCodeError || !usedInviteCode) {
    await supabase.auth.signOut();
    await deleteCreatedUser(userId);

    return { error: "招待コードを使用できませんでした。もう一度お試しください。" };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    nickname,
  });

  if (profileError) {
    await clearInviteCodeUse(inviteCode, userId);
    await supabase.auth.signOut();
    await deleteCreatedUser(userId);

    if (profileError.code === "23505") {
      return { error: "このニックネームは既に使用されています" };
    }

    return { error: "プロフィール作成に失敗しました。もう一度お試しください。" };
  }

  if (signupData.session) {
    revalidatePath("/", "layout");
    redirect("/home/places");
  }

  redirect("/login?signup=success");
}
