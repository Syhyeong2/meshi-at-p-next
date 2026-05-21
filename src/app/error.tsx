"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

type RootErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function RootError({ error, unstable_retry }: RootErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleReturnHome = () => {
    window.location.assign("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section
        role="alert"
        aria-labelledby="root-error-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="bg-primary-background mx-auto flex size-14 items-center justify-center rounded-full">
          <AlertTriangle className="text-primary size-7" aria-hidden="true" />
        </div>

        <h1 id="root-error-title" className="mt-6 text-2xl font-bold text-slate-950">
          ページを読み込めませんでした
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          一時的な問題が発生しました。もう一度お試しください。
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs font-medium text-slate-400">エラーID: {error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" size="sm" className="h-11 flex-1" onClick={() => unstable_retry()}>
            もう一度試す
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 flex-1"
            onClick={handleReturnHome}
          >
            トップへ戻る
          </Button>
        </div>
      </section>
    </main>
  );
}
