// マイレビューページで使用するカードコンポーネント
"use client";

import { StarRating } from "@/features/review/components/StarRating";
import { Tag } from "@/components/ui/Tag";
import Link from "next/link";

/**
 * テスト使用例:
 * import { MyReviewCard } from "@/features/review/components/MyReviewCard";
 * * <MyReviewCard
 * id="review-123"
 * place="イタリアン トラットリア"
 * rating={4}
 * comment="とても静かなカフェで、集中して作業ができました！"
 * date={new Date()}
 * tags={["おしゃれ", "ランチ"]}
 * href="/home/mypage?panel=my-reviews&reviewId=review-123" // 遷移先URL (必須)
 * isSelected={false} // 選択状態のハイライト表示 (必須)
 * />
 */

// 型定義
interface MyReviewCardProps {
  id: string; //レビューID. onclick時に使用
  place: string; // お店の名前
  rating: number; //レート(星)
  tags: string[]; //タグたち
  comment: string; //コメント
  date: Date; //日付(created_at or visited_at)
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  href: string;
  isSelected: boolean;
}

export const MyReviewCard = ({
  place,
  rating,
  comment,
  date,
  tags,
  href,
  isSelected,
}: MyReviewCardProps) => {
  const formattedDate = new Date(date).toLocaleDateString("sv-SE");

  return (
    <Link
      href={href}
      aria-current={isSelected ? "true" : undefined}
      scroll={false}
      className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-3 ${isSelected ? "border-primary bg-primary-background" : "border-slate-200 bg-white hover:border-slate-100"}`}
    >
      {/* 店名と星を一列に */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-slate-900">{place}</p>
        <div className="ml-auto">
          <StarRating rating={rating} />
        </div>
      </div>
      <div className="flex gap-2">
        {tags.map((tag) => (
          <Tag key={tag} variant="primary">
            {tag}
          </Tag>
        ))}
      </div>

      {/* 3行制限のコメント */}
      <p className="wrap-break-words line-clamp-1 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
        {comment}
      </p>

      {/* 日付 */}
      <span className="text-muted-foreground text-xs font-medium text-slate-500">
        {formattedDate}
      </span>
    </Link>
  );
};
