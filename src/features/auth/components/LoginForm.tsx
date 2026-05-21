"use client";

import Link from "next/link";
import { useActionState } from "react";
import { User, Lock } from "lucide-react";

import { loginAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/Form";

type LoginFormProps = {
  signupSuccess?: boolean;
};

export function LoginForm({ signupSuccess }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, {});
  const nicknameError = state?.fieldErrors?.nickname?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-9 shadow-sm">
      <form action={formAction} className="flex flex-col gap-7" noValidate>
        <div>
          <h2 className="text-center text-2xl font-bold text-slate-950">ログイン</h2>
          {signupSuccess && (
            <p className="mt-2 text-center text-sm font-medium text-emerald-600">
              アカウント登録が完了しました。
              <br />
              ログインしてください。
            </p>
          )}
        </div>

        <FormItem>
          <FormLabel className="text-base font-medium text-slate-950">
            ニックネーム <span className="text-red-600">*</span>
          </FormLabel>
          <FormControl className="mt-3">
            <Input
              variant="auth"
              name="nickname"
              type="text"
              autoComplete="nickname"
              defaultValue={state?.values?.nickname}
              aria-invalid={!!nicknameError}
              leftIcon={User}
              placeholder="ニックネームを入力"
              required
            />
          </FormControl>
          <FormMessage>{nicknameError}</FormMessage>
        </FormItem>

        <FormItem>
          <FormLabel className="text-base font-medium text-slate-950">
            パスワード <span className="text-red-600">*</span>
          </FormLabel>
          <FormControl className="mt-3">
            <Input
              variant="auth"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!passwordError}
              leftIcon={Lock}
              placeholder="パスワードを入力"
              required
            />
          </FormControl>
          <FormMessage>{passwordError}</FormMessage>
        </FormItem>

        {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "ログイン中..." : "ログイン"}
        </Button>

        <div className="mt-4 text-center text-sm text-slate-600">
          まだアカウントをお持ちでないですか？{" "}
          <Link
            href="/signup"
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            新規登録
          </Link>
        </div>
      </form>
    </div>
  );
}
