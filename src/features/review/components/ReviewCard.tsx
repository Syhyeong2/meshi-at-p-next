// お店詳細ページとお店のレビューリストページで使用するレビューカードコンポーネント
"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { StarRating } from "@/features/review/components/StarRating";

//使用例:
// import { ReviewCard } from "@/features/review/components/ReviewCard";
// <ReviewCard
//   id="(uuid)"
//   name="田中 太郎"
//   rating={4}
//   comment="とても静かなカフェで、集中して作業ができました！コーヒーも美味しかったです。ぎゃおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおお。ペイペイ！"
//   date={new Date()}
//   variant="placeDetail"
// />

// 型定義
interface ReviewCardProps {
  id: string; //レビューID. onclick時に使用
  name: string; // ユーザーネーム
  rating: number; //レート(星)
  comment: string; //コメント
  date: Date | string; //日付(created_at or visited_at)
  variant: "reviewList" | "placeDetail"; //お店詳細ページかレビューリストかで見た目を変える
  href?: string;
  onClick?: (id: string) => void;
}

export const ReviewCard = ({
  id,
  name,
  rating,
  comment,
  date,
  href,
  variant = "reviewList",
  onClick,
}: ReviewCardProps) => {
  const formattedDate = new Date(date).toLocaleDateString("sv-SE");
  const isDetail = variant === "placeDetail";
  const cardClassName = `bg-card block cursor-pointer rounded-xl p-4 transition-all duration-200 ${
    isDetail ? `bg-slate-50` : `border border-slate-200 bg-white`
  }`;
  const cardContent = (
    <>
      <div className="flex items-center gap-3">
        {/* ユーザーアイコン コンポーネント化も検討 */}
        <div className="bg-primary-background flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <User size={18} className="text-primary" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{name}</p>

          <div className="flex items-center gap-3">
            {/* 星（レート） */}
            <StarRating rating={rating} />
            {/* 日付 */}
            <span className="text-muted-foreground text-[12px] font-medium text-slate-500">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* 3行制限のコメント */}
      {comment && comment.trim() !== "" && (
        <p
          className={`mt-3 text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-700 ${isDetail ? `line-clamp-1` : `line-clamp-3`} `}
        >
          {comment}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} scroll={false} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={() => onClick?.(id)} className={cardClassName}>
      {cardContent}
    </div>
  );
};
