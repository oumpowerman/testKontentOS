import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { User } from "../../../../../types";
import { UserStat } from "../types";
import { EmployeeNameCell } from "./cells/EmployeeNameCell";
import { StatBadgeCell } from "./cells/StatBadgeCell";
import { GradeBadgeCell } from "./cells/GradeBadgeCell";

interface EmployeeRowProps {
  stat: UserStat;
  user: User;
  index: number;
  activeStatFilter?: string;
  sortDirection: "ASC" | "DESC";
  getGrade: (stat: UserStat) => { grade: string; color: string };
  onUserClick: (user: User, stat: UserStat) => void;
  currentMonth?: Date;
  workingDaysCount?: number;
  lateViewMode?: "DAYS" | "HOURS";
  otViewMode?: "HOURS" | "PAYOUT";
}

const EmployeeRowComponent: React.FC<EmployeeRowProps> = ({
  stat,
  user,
  index,
  activeStatFilter,
  sortDirection,
  getGrade,
  onUserClick,
  currentMonth,
  workingDaysCount,
  lateViewMode = "DAYS",
  otViewMode = "HOURS",
}) => {
  const isHighlightedRank =
    !!(activeStatFilter && activeStatFilter !== "ALL" && index < 3);
  const rank = index + 1;
  const isNegativeFilter =
    activeStatFilter === "LATE" ||
    activeStatFilter === "ABSENT" ||
    activeStatFilter === "LEAVE";
  const isSortDESC = sortDirection === "DESC";
  const shouldShowNegativeTheme = isNegativeFilter ? isSortDESC : !isSortDESC;

  // Perfect Attendance Condition
  const isPerfect = stat.late === 0 && stat.absent === 0 && stat.leaves === 0 && stat.present > 0;

  const getPerfectAttendanceTier = (presentCount: number) => {
    if (presentCount >= 22) {
      return {
        tier: "RAINBOW",
        borderLeftColor: "border-l-4 border-pink-400",
        glowClass: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
        bgClass: "bg-rainbow-pastel animate-gradient-x-slow border border-pink-200/40",
        bgStyle: { '--rainbow-alpha': 0.15 } as React.CSSProperties,
        animateBg: "rgba(255, 255, 255, 0)", // handled by gradient class
        hoverBg: "rgba(255, 255, 255, 0.1)",
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(236,72,153,0.18)",
      };
    }
    if (presentCount >= 15) {
      return {
        tier: "GOLD",
        borderLeftColor: "border-l-4 border-amber-400",
        glowClass: "shadow-[0_0_15px_rgba(245,158,11,0.12)]",
        bgClass: "bg-amber-50/45 border-b border-amber-100/50",
        bgStyle: undefined,
        animateBg: "rgba(254, 243, 199, 0.45)",
        hoverBg: "rgba(254, 243, 199, 0.65)",
        scale: 1.015,
        boxShadow: "0 6px 18px rgba(245,158,11,0.1)",
      };
    }
    if (presentCount >= 8) {
      return {
        tier: "SILVER",
        borderLeftColor: "border-l-4 border-slate-400",
        glowClass: "shadow-[0_0_10px_rgba(148,163,184,0.08)]",
        bgClass: "bg-slate-50/50 border-b border-slate-100/50",
        bgStyle: undefined,
        animateBg: "rgba(248, 250, 252, 0.70)",
        hoverBg: "rgba(241, 245, 249, 0.85)",
        scale: 1.012,
        boxShadow: "0 4px 12px rgba(148,163,184,0.06)",
      };
    }
    return {
      tier: "BRONZE",
      borderLeftColor: "border-l-4 border-orange-300",
      glowClass: "shadow-[0_0_8px_rgba(249,115,22,0.05)]",
      bgClass: "bg-orange-50/15 border-b border-orange-100/50",
      bgStyle: undefined,
      animateBg: "rgba(255, 247, 237, 0.15)",
      hoverBg: "rgba(255, 247, 237, 0.35)",
      scale: 1.01,
      boxShadow: "0 2px 8px rgba(249,115,22,0.03)",
    };
  };

  let rowBgClass = "hover:bg-indigo-50/30 transition-all cursor-pointer group relative";
  let borderLeftClass = "border-l-4 border-transparent";
  let perfectTier = isPerfect ? getPerfectAttendanceTier(stat.present) : null;

  if (isPerfect && perfectTier) {
    rowBgClass = `${perfectTier.bgClass} cursor-pointer group relative ${perfectTier.glowClass}`;
    borderLeftClass = perfectTier.borderLeftColor;
  } else if (isHighlightedRank) {
    if (shouldShowNegativeTheme) {
      if (rank === 1) {
        rowBgClass = "cursor-pointer group relative";
        borderLeftClass = "border-l-4 border-red-700";
      } else if (rank === 2) {
        rowBgClass = "cursor-pointer group relative";
        borderLeftClass = "border-l-4 border-red-500";
      } else if (rank === 3) {
        rowBgClass = "cursor-pointer group relative";
        borderLeftClass = "border-l-4 border-red-300";
      }
    } else {
      if (rank === 1) {
        rowBgClass = "cursor-pointer group relative";
        borderLeftClass = "border-l-4 border-amber-500";
      } else if (rank === 2) {
        rowBgClass = "cursor-pointer group relative";
        borderLeftClass = "border-l-4 border-slate-400";
      } else if (rank === 3) {
        rowBgClass = "cursor-pointer group relative";
        borderLeftClass = "border-l-4 border-orange-400";
      }
    }
  }

  // Animation values
  const getAnimateConfig = () => {
    if (isPerfect && perfectTier) {
      return {
        opacity: 1,
        y: 0,
        backgroundColor: perfectTier.animateBg,
      };
    }
    if (isHighlightedRank) {
      return {
        opacity: 1,
        y: 0,
        backgroundColor: shouldShowNegativeTheme
          ? rank === 1
            ? "rgba(254, 226, 226, 0.60)"
            : rank === 2
            ? "rgba(254, 226, 226, 0.30)"
            : "rgba(254, 226, 226, 0.10)"
          : rank === 1
          ? "rgba(254, 243, 199, 0.45)"
          : rank === 2
          ? "rgba(248, 250, 252, 0.70)"
          : "rgba(255, 247, 237, 0.25)",
      };
    }
    return {
      opacity: 1,
      y: 0,
      backgroundColor: "rgba(255, 255, 255, 0)",
    };
  };

  const getHoverConfig = () => {
    if (isPerfect && perfectTier) {
      return {
        scale: perfectTier.scale,
        backgroundColor: perfectTier.hoverBg,
        boxShadow: perfectTier.boxShadow,
        transition: { duration: 0.15 },
      };
    }
    if (isHighlightedRank) {
      return {
        scale: 1.012,
        backgroundColor: shouldShowNegativeTheme
          ? rank === 1
            ? "rgba(254, 202, 202, 0.60)"
            : rank === 2
            ? "rgba(254, 202, 202, 0.45)"
            : "rgba(254, 202, 202, 0.30)"
          : rank === 1
          ? "rgba(254, 243, 199, 0.65)"
          : rank === 2
          ? "rgba(241, 245, 249, 0.80)"
          : "rgba(255, 237, 213, 0.35)",
        boxShadow: shouldShowNegativeTheme
          ? rank === 1
            ? "0 6px 20px -4px rgba(220, 38, 38, 0.15)"
            : rank === 2
            ? "0 4px 12px -3px rgba(220, 38, 38, 0.08)"
            : "0 2px 8px -2px rgba(220, 38, 38, 0.04)"
          : rank === 1
          ? "0 6px 20px -4px rgba(245, 158, 11, 0.15)"
          : rank === 2
          ? "0 4px 12px -3px rgba(148, 163, 184, 0.12)"
          : "0 2px 8px -2px rgba(249, 115, 22, 0.06)",
        transition: { duration: 0.15 },
      };
    }
    return {
      scale: 1.01,
      backgroundColor: "rgba(249, 250, 251, 0.8)",
      transition: { duration: 0.15 },
    };
  };

  return (
    <motion.tr
      className={`${rowBgClass} ${borderLeftClass}`}
      style={perfectTier?.bgStyle}
      onClick={() => onUserClick(user, stat)}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={getAnimateConfig()}
      whileHover={getHoverConfig()}
      transition={{
        layout: {
          type: "spring",
          stiffness: 220,
          damping: 26,
        },
        opacity: { duration: 0.35 },
        backgroundColor: { duration: 0.25 },
      }}
    >
      <EmployeeNameCell
        user={user}
        isHighlightedRank={isHighlightedRank}
        rank={rank}
        shouldShowNegativeTheme={shouldShowNegativeTheme}
        stat={stat}
        workingDaysCount={workingDaysCount}
      />
      <StatBadgeCell value={stat.present} variant="present" />
      <StatBadgeCell 
        value={lateViewMode === "HOURS" ? (stat.totalLateMinutes || 0) : stat.late} 
        variant="late" 
        lateViewMode={lateViewMode} 
      />
      <StatBadgeCell value={stat.absent} variant="absent" />
      <StatBadgeCell value={stat.leaves} variant="leave" />
      
      {/* OT Column Cell */}
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center h-8">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${otViewMode}-${stat.totalOtHours || 0}-${stat.totalOtPayout || 0}`}
              initial={{ opacity: 0, scale: 0.9, y: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 2 }}
              transition={{ duration: 0.12 }}
              className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                (stat.totalOtHours || 0) > 0
                  ? otViewMode === "HOURS"
                    ? "bg-purple-50 text-purple-600"
                    : "bg-emerald-50 text-emerald-600 font-mono"
                  : "text-gray-400"
              }`}
            >
              {otViewMode === "HOURS" 
                ? `${(stat.totalOtHours || 0).toFixed(1)} hrs`
                : `฿${(stat.totalOtPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              }
            </motion.span>
          </AnimatePresence>
        </div>
      </td>

      <StatBadgeCell value={stat.totalHours} variant="hours" />
      <GradeBadgeCell grade={getGrade(stat)} />

      {/* Sparkle micro-animation inside the row for top tiers */}
      {isPerfect && perfectTier && (
        <td className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {perfectTier.tier === "RAINBOW" && (
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="text-pink-500"
            >
              <Sparkles className="w-5 h-5 fill-pink-400" />
            </motion.div>
          )}
          {perfectTier.tier === "GOLD" && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-amber-500"
            >
              <Sparkles className="w-4 h-4 fill-amber-300" />
            </motion.div>
          )}
        </td>
      )}
    </motion.tr>
  );
};

export const EmployeeRow = React.memo(
  EmployeeRowComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.activeStatFilter === nextProps.activeStatFilter &&
      prevProps.sortDirection === nextProps.sortDirection &&
      prevProps.stat === nextProps.stat &&
      prevProps.user.id === nextProps.user.id &&
      prevProps.user.name === nextProps.user.name &&
      prevProps.user.avatarUrl === nextProps.user.avatarUrl &&
      prevProps.user.position === nextProps.user.position &&
      prevProps.currentMonth === nextProps.currentMonth &&
      prevProps.workingDaysCount === nextProps.workingDaysCount &&
      prevProps.lateViewMode === nextProps.lateViewMode &&
      prevProps.otViewMode === nextProps.otViewMode
    );
  }
);
