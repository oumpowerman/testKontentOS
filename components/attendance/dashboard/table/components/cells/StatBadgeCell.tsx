import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StatBadgeCellProps {
  value: number;
  variant: "present" | "late" | "absent" | "leave" | "hours";
  lateViewMode?: "DAYS" | "HOURS";
}

export const StatBadgeCell: React.FC<StatBadgeCellProps> = ({
  value,
  variant,
  lateViewMode = "DAYS",
}) => {
  let cellClass = "";

  if (variant === "present") {
    cellClass =
      "inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700";
  } else if (variant === "late") {
    cellClass = `inline-block px-3 py-1 rounded-lg text-sm font-bold ${
      value > 0 ? "bg-red-50 text-red-600" : "text-gray-400"
    }`;
  } else if (variant === "absent") {
    cellClass = `inline-block px-3 py-1 rounded-lg text-sm font-bold ${
      value > 0 ? "bg-red-100 text-red-700" : "text-gray-400"
    }`;
  } else if (variant === "leave") {
    cellClass = `inline-block px-3 py-1 rounded-lg text-sm font-bold ${
      value > 0 ? "bg-pink-50 text-pink-600" : "text-gray-400"
    }`;
  }

  const getLateDisplay = (val: number) => {
    if (val <= 0) return "0";
    const hrs = Math.floor(val / 60);
    const mins = val % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <td className="px-6 py-4 text-center">
      {variant === "hours" ? (
        <span className="text-sm font-mono text-gray-600">
          {value.toFixed(1)} h
        </span>
      ) : variant === "late" ? (
        <div className="flex items-center justify-center h-8">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${lateViewMode}-${value}`}
              initial={{ opacity: 0, scale: 0.9, y: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 2 }}
              transition={{ duration: 0.12 }}
              className={cellClass}
            >
              {lateViewMode === "HOURS" ? getLateDisplay(value) : value}
            </motion.span>
          </AnimatePresence>
        </div>
      ) : (
        <span className={cellClass}>{value}</span>
      )}
    </td>
  );
};
