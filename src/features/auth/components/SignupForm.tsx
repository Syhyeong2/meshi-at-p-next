"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { User, Lock, Key } from "lucide-react";

import { signupWithInviteAction, AuthActionState } from "../actions";
import { signupWithInviteSchema } from "../schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/Form";

type SignupFormProps = {
  initialInviteCode?: string;
};

export function SignupForm({ initialInviteCode = "" }: SignupFormProps) {
  const [state, formAction] = useActionState(signupWithInviteAction, {});
  const [isPending, startTransition] = useTransition();

  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    nickname: "",
    password: "",
    confirmPassword: "",
    inviteCode: initialInviteCode,
  });

  const getErrorMessage = (fieldName: string): string | undefined => {
    const serverFieldErrors = state?.fieldErrors as
      | Record<string, string[] | undefined>
      | undefined;
    const serverFieldError = serverFieldErrors?.[fieldName]?.[0];
    return clientErrors[fieldName]?.[0] || serverFieldError;
  };

  const isFormEmpty =
    !formData.nickname || !formData.password || !formData.confirmPassword || !formData.inviteCode;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleAction = async (rawFormData: FormData) => {
    setClientErrors({});

    const data = Object.fromEntries(rawFormData);
    const result = signupWithInviteSchema.safeParse(data);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      setClientErrors(formattedErrors as Record<string, string[]>);
      return;
    }

    startTransition(() => {
      formAction(rawFormData);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-9">
      <form action={handleAction} className="flex flex-col gap-7" noValidate>
        <div>
          <h2 className="text-center text-2xl font-bold text-slate-950">新規登録</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            招待コードを使ってアカウントを作成しましょう
          </p>
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
              value={formData.nickname}
              aria-invalid={!!getErrorMessage("nickname")}
              leftIcon={User}
              placeholder="ニックネームを入力 (2~12文字)"
              required
              onChange={handleInputChange}
            />
          </FormControl>
          <FormMessage>{getErrorMessage("nickname")}</FormMessage>
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
              autoComplete="new-password"
              value={formData.password}
              aria-invalid={!!getErrorMessage("password")}
              leftIcon={Lock}
              placeholder="8文字以上のパスワード"
              required
              onChange={handleInputChange}
            />
          </FormControl>
          <FormMessage>{getErrorMessage("password")}</FormMessage>
        </FormItem>

        <FormItem>
          <FormLabel className="text-base font-medium text-slate-950">
            パスワード確認 <span className="text-red-600">*</span>
          </FormLabel>
          <FormControl className="mt-3">
            <Input
              variant="auth"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              aria-invalid={!!getErrorMessage("confirmPassword")}
              leftIcon={Lock}
              placeholder="パスワードを再入力"
              required
              onChange={handleInputChange}
            />
          </FormControl>
          <FormMessage>{getErrorMessage("confirmPassword")}</FormMessage>
        </FormItem>

        <FormItem>
          <FormLabel className="text-base font-medium text-slate-950">
            招待コード <span className="text-red-600">*</span>
          </FormLabel>
          <FormControl className="mt-3">
            <Input
              variant="auth"
              name="inviteCode"
              type="text"
              value={formData.inviteCode}
              aria-invalid={!!getErrorMessage("inviteCode")}
              leftIcon={Key}
              placeholder="招待コードを入力"
              required
              readOnly={!!initialInviteCode}
              onChange={handleInputChange}
            />
          </FormControl>
          <FormMessage>{getErrorMessage("inviteCode")}</FormMessage>
        </FormItem>

        {state?.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

        <Button type="submit" className="w-full" disabled={isPending || isFormEmpty}>
          {isPending ? "登録中..." : "登録する"}
        </Button>

        <div className="mt-4 text-center text-sm text-slate-600">
          既にアカウントをお持ちですか？{" "}
          <Link
            href="/login"
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            ログイン
          </Link>
        </div>
      </form>
    </div>
  );
}
