import React from "react";
import { Award, Sparkles, Flame, TrendingUp, CheckCircle } from "lucide-react";
import { User } from "../../../../../../types";
import { UserStat } from "../../types";

interface EmployeeNameCellProps {
  user: User;
  isHighlightedRank: boolean;
  rank: number;
  shouldShowNegativeTheme: boolean;
  stat?: UserStat;
  workingDaysCount?: number;
}

export const EmployeeNameCell: React.FC<EmployeeNameCellProps> = ({
  user,
  isHighlightedRank,
  rank,
  shouldShowNegativeTheme,
  stat,
  workingDaysCount,
}) => {
  let avatarBorderClass = "border border-gray-100";
  let nameTextClass = "text-gray-800";
  let badgeElement: React.ReactNode = null;
  let nameBadgeElement: React.ReactNode = null;

  const isPerfect = stat ? (stat.late === 0 && stat.absent === 0 && stat.leaves === 0 && stat.present > 0) : false;

  const getPerfectTier = (presentCount: number) => {
    if (presentCount >= 22) {
      return {
        tier: "RAINBOW",
        badgeText: "ว่าที่เบี้ยขยันสุดยอด!",
        emoji: "👑",
        colorClass: "from-pink-500 via-purple-500 to-teal-500 text-transparent bg-clip-text font-extrabold animate-pulse",
        bgClass: "bg-gradient-to-r from-pink-100 via-purple-100 to-teal-100 text-pink-700 border border-pink-200/50",
      };
    }
    if (presentCount >= 15) {
      return {
        tier: "GOLD",
        badgeText: "นิ่งดั่งทองแท้",
        emoji: "🥇",
        colorClass: "text-amber-600 font-extrabold",
        bgClass: "bg-amber-100 text-amber-800 border border-amber-200",
      };
    }
    if (presentCount >= 8) {
      return {
        tier: "SILVER",
        badgeText: "รักษาวินัยเยี่ยม",
        emoji: "🥈",
        colorClass: "text-slate-600 font-bold",
        bgClass: "bg-slate-100 text-slate-800 border border-slate-200",
      };
    }
    return {
      tier: "BRONZE",
      badgeText: "ต้นเดือนฟอร์มดี",
      emoji: "🥉",
      colorClass: "text-orange-600 font-medium",
      bgClass: "bg-orange-50 text-orange-800 border border-orange-100",
    };
  };

  if (isHighlightedRank) {
    if (shouldShowNegativeTheme) {
      if (rank === 1) {
        avatarBorderClass =
          "border-2 border-red-500 ring-2 ring-red-400/30 shadow-md";
        nameTextClass = "text-red-950 font-black";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-700 to-red-800 text-white shadow-md border border-white text-[10px] font-black">
            1
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-full uppercase tracking-wider shadow-sm animate-pulse whitespace-nowrap shrink-0">
            🚨 Rank 1
          </span>
        );
      } else if (rank === 2) {
        avatarBorderClass =
          "border-2 border-red-400 ring-2 ring-red-300/20 shadow-xs";
        nameTextClass = "text-red-900 font-bold";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md border border-white text-[10px] font-bold">
            2
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            Rank 2
          </span>
        );
      } else if (rank === 3) {
        avatarBorderClass = "border border-red-200 shadow-2xs";
        nameTextClass = "text-red-800 font-medium";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md border border-white text-[10px] font-bold">
            3
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            Rank 3
          </span>
        );
      }
    } else {
      if (rank === 1) {
        avatarBorderClass =
          "border-2 border-amber-400 ring-2 ring-amber-300/30 shadow-md";
        nameTextClass = "text-amber-950 font-black";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md border border-white">
            <Award className="w-3 h-3 text-amber-100 fill-amber-100" />
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-amber-100 fill-amber-100" />
            Top 1
          </span>
        );
      } else if (rank === 2) {
        avatarBorderClass =
          "border-2 border-slate-400 ring-2 ring-slate-200/20 shadow-xs";
        nameTextClass = "text-slate-900 font-bold";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-md border border-white text-[10px] font-bold">
            2
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            🥈 Top 2
          </span>
        );
      } else if (rank === 3) {
        avatarBorderClass = "border border-orange-200 shadow-2xs";
        nameTextClass = "text-orange-950 font-medium";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md border border-white text-[10px] font-bold">
            3
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            🥉 Top 3
          </span>
        );
      }
    }
  }

  // Adjust avatar and borders for perfect attendance tier
  let perfectTierInfo = null;
  let perfectDaysRemaining = 0;
  if (isPerfect && stat) {
    perfectTierInfo = getPerfectTier(stat.present);
    perfectDaysRemaining = workingDaysCount ? (workingDaysCount - stat.present) : (22 - stat.present);
    
    if (perfectTierInfo.tier === "RAINBOW") {
      avatarBorderClass = "border-2 border-pink-400 ring-2 ring-pink-300/40 shadow-[0_0_12px_rgba(236,72,153,0.4)] animate-pulse";
    } else if (perfectTierInfo.tier === "GOLD") {
      avatarBorderClass = "border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
    } else if (perfectTierInfo.tier === "SILVER") {
      avatarBorderClass = "border-2 border-slate-300 ring-2 ring-slate-200/40 shadow-[0_0_8px_rgba(148,163,184,0.2)]";
    } else {
      avatarBorderClass = "border border-orange-300 shadow-[0_0_6px_rgba(249,115,22,0.15)]";
    }
  }

  return (
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={user.avatarUrl}
            referrerPolicy="no-referrer"
            className={`w-10 h-10 rounded-full bg-gray-200 object-cover shrink-0 ${avatarBorderClass}`}
          />
          {badgeElement}
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-bold ${nameTextClass}`}>{user.name}</p>
            {nameBadgeElement}
            {isPerfect && perfectTierInfo && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 bg-emerald-500 text-white rounded-md whitespace-nowrap shadow-xs animate-bounce">
                ✨ Perfect
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-gray-500">{user.position}</p>
          </div>

          {isPerfect && stat && perfectTierInfo && (
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-bold ${perfectTierInfo.bgClass} shadow-xs shrink-0`}>
                  {perfectTierInfo.emoji} {perfectTierInfo.badgeText}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 shrink-0">
                  <Flame className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />
                  {stat.present} วันรวด
                </span>
              </div>
              {perfectDaysRemaining > 0 ? (
                <p className="text-[9px] text-indigo-500 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                  อีก {perfectDaysRemaining} วันรับเบี้ยขยันสิ้นเดือน!
                </p>
              ) : (
                <p className="text-[9px] text-emerald-600 font-black flex items-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5 fill-emerald-100 shrink-0" />
                  สำเร็จ! พิชิตเบี้ยขยันสิ้นเดือนสำเร็จ 🎉
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </td>
  );
};
