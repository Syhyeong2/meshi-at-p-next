"use client";

import { useRouter } from "next/navigation";
import { HomePanelFrame } from "../../_panel/HomePanelFrame";

type EditPlaceReviewPanelProps = {
  closeHref: string;
  placeId: string;
  reviewId: string;
};

export function EditPlaceReviewPanel({ closeHref, placeId, reviewId }: EditPlaceReviewPanelProps) {
  const router = useRouter();

  return (
    <HomePanelFrame title="レビューの編集" closeHref={closeHref}>
      <div className="animate-in slide-in-from-right flex h-full w-full flex-col justify-between border-l border-slate-200 bg-slate-50 p-6 shadow-lg duration-200">
        {/* 疎通データ確認エリア */}
        <div className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-bold">🛰️ 管制塔から届いたパラメーター情報：</p>
            <p className="pt-1 font-mono text-xs">【店舗ID】: {placeId}</p>
            <p className="font-mono text-xs">【レビューID】: {reviewId}</p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center text-slate-400 shadow-sm">
            <p className="mb-1 text-sm font-bold text-slate-600">
              ここに本番用のフォームが降臨する
            </p>
            <p className="max-w-xs text-xs">
              いま受け取ったレビューIDを使って、DBから過去のコメントや星評価をロードするロジックをこの後ここにガッチャンコするぞ！
            </p>
          </div>
        </div>

        {/* フッターボタンエリア */}
        <div className="-mx-6 mt-auto -mb-6 flex gap-3 border-t border-slate-200 bg-white p-6 pt-4">
          <button
            type="button"
            onClick={() => router.push(closeHref)}
            className="flex-1 rounded-lg bg-slate-100 p-3 text-center text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={() => {
              alert("テスト画面のため、まだ保存はできません！");
              router.push(closeHref);
            }}
            className="flex-1 rounded-lg bg-blue-600 p-3 text-center text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700"
          >
            テスト完了
          </button>
        </div>
      </div>
    </HomePanelFrame>
  );
}
