import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User } from "../../../types";
import { useTableGrouping } from "./table/hooks/useTableGrouping";
import { TableHeader } from "./table/components/TableHeader";
import { TableGroupRow } from "./table/components/TableGroupRow";
import { EmployeeRow } from "./table/components/EmployeeRow";
import { UserStat, GroupMode, DashboardTableProps } from "./table/types";

const DashboardTable: React.FC<DashboardTableProps> = ({
  isLoading,
  filteredStats,
  users,
  getGrade,
  onUserClick,
  activeStatFilter,
  sortDirection,
  onSortDirectionChange,
  currentMonth,
  workingDaysCount,
  lateViewMode = "DAYS",
  onLateViewModeChange,
  otViewMode = "HOURS",
  onOtViewModeChange,
}) => {
  const [groupMode, setGroupMode] = useState<GroupMode>("POSITION");
  // Collapsible states: initially all expanded
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeStatFilter, groupMode]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Group and sort logic is cleanly encapsulated inside the custom hook
  const { groups, groupedData } = useTableGrouping({
    filteredStats,
    users,
    groupMode,
    sortDirection,
    activeStatFilter,
    lateViewMode,
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Control Header Component */}
      <TableHeader
        groupMode={groupMode}
        setGroupMode={setGroupMode}
        sortDirection={sortDirection}
        onSortDirectionChange={onSortDirectionChange}
        activeStatFilter={activeStatFilter}
      />

      <div className="overflow-x-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Dynamic Scan Line Indicator */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
            >
              <motion.div
                className="h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ position: "absolute" }}
              />
              <div className="absolute inset-0 bg-indigo-500/[0.02] animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="px-6 py-4 font-bold">Employee</th>

              {/* Days Present Header */}
              <th
                className={`px-6 py-4 font-bold text-center select-none transition-colors ${
                  activeStatFilter === "PRESENT" || activeStatFilter === "ALL"
                    ? "cursor-pointer text-indigo-600 hover:bg-indigo-50/40 rounded-t-lg"
                    : ""
                }`}
                onClick={() => {
                  if (
                    activeStatFilter === "PRESENT" ||
                    activeStatFilter === "ALL"
                  ) {
                    onSortDirectionChange(
                      sortDirection === "ASC" ? "DESC" : "ASC"
                    );
                  }
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Days Present</span>
                  {(activeStatFilter === "PRESENT" ||
                    activeStatFilter === "ALL") &&
                    (sortDirection === "ASC" ? (
                      <span className="text-indigo-500">▲</span>
                    ) : (
                      <span className="text-indigo-500">▼</span>
                    ))}
                </div>
              </th>

              {/* Late Count Header */}
              <th
                className={`px-6 py-4 font-bold text-center select-none transition-colors ${
                  activeStatFilter === "LATE"
                    ? "cursor-pointer text-red-600 hover:bg-red-50/40 rounded-t-lg"
                    : ""
                }`}
                onClick={() => {
                  if (activeStatFilter === "LATE") {
                    onSortDirectionChange(
                      sortDirection === "ASC" ? "DESC" : "ASC"
                    );
                  }
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="whitespace-nowrap">LATE</span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLateViewModeChange?.(lateViewMode === "DAYS" ? "HOURS" : "DAYS");
                    }}
                    className={`inline-flex items-center h-6 px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-colors duration-200 cursor-pointer ${
                      lateViewMode === "DAYS"
                        ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={lateViewMode}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="inline-flex items-center gap-1"
                      >
                        <span>{lateViewMode === "DAYS" ? "Days" : "Hrs"}</span>
                        <span className="text-[10px] opacity-70">⇄</span>
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                  {activeStatFilter === "LATE" &&
                    (sortDirection === "ASC" ? (
                      <span className="text-red-500">▲</span>
                    ) : (
                      <span className="text-red-500">▼</span>
                    ))}
                </div>
              </th>

              {/* Absent Header */}
              <th
                className={`px-6 py-4 font-bold text-center select-none transition-colors ${
                  activeStatFilter === "ABSENT"
                    ? "cursor-pointer text-red-600 hover:bg-red-50/40 rounded-t-lg"
                    : ""
                }`}
                onClick={() => {
                  if (activeStatFilter === "ABSENT") {
                    onSortDirectionChange(
                      sortDirection === "ASC" ? "DESC" : "ASC"
                    );
                  }
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Absent</span>
                  {activeStatFilter === "ABSENT" &&
                    (sortDirection === "ASC" ? (
                      <span className="text-red-500">▲</span>
                    ) : (
                      <span className="text-red-500">▼</span>
                    ))}
                </div>
              </th>

              {/* Leaves Header */}
              <th
                className={`px-6 py-4 font-bold text-center select-none transition-colors ${
                  activeStatFilter === "LEAVE"
                    ? "cursor-pointer text-pink-600 hover:bg-pink-50/40 rounded-t-lg"
                    : ""
                }`}
                onClick={() => {
                  if (activeStatFilter === "LEAVE") {
                    onSortDirectionChange(
                      sortDirection === "ASC" ? "DESC" : "ASC"
                    );
                  }
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Leaves</span>
                  {activeStatFilter === "LEAVE" &&
                    (sortDirection === "ASC" ? (
                      <span className="text-pink-500">▲</span>
                    ) : (
                      <span className="text-pink-500">▼</span>
                    ))}
                </div>
              </th>

              {/* Overtime (OT) Header */}
              <th className="px-6 py-4 font-bold text-center select-none transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <span className="whitespace-nowrap">OT</span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOtViewModeChange?.(otViewMode === "HOURS" ? "PAYOUT" : "HOURS");
                    }}
                    className={`inline-flex items-center h-6 px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-colors duration-200 cursor-pointer ${
                      otViewMode === "HOURS"
                        ? "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={otViewMode}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="inline-flex items-center gap-1"
                      >
                        <span>{otViewMode === "HOURS" ? "Hrs" : "Payout ฿"}</span>
                        <span className="text-[10px] opacity-70">⇄</span>
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </th>

              <th className="px-6 py-4 font-bold text-center">Total Hours</th>
              <th className="px-6 py-4 font-bold text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400">
                  Loading Report...
                </td>
              </tr>
            ) : filteredStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400">
                  ไม่พบข้อมูลพนักงาน
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const groupStats = groupedData[group.id] || [];
                if (groupStats.length === 0) return null;

                const isCollapsed = collapsedGroups[group.id];

                return (
                  <React.Fragment key={group.id}>
                    {/* Collapsible Section Header Row */}
                    {groupMode !== "NONE" && (
                      <TableGroupRow
                        group={group}
                        count={groupStats.length}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleGroup(group.id)}
                      />
                    )}

                    {/* Highly performant list of single rows */}
                    {(groupMode === "NONE" || !isCollapsed) &&
                      groupStats.map((stat, idx) => {
                        const user = users.find((u) => u.id === stat.userId);
                        if (!user) return null;

                        return (
                          <EmployeeRow
                            key={stat.userId}
                            stat={stat}
                            user={user}
                            index={idx}
                            activeStatFilter={activeStatFilter}
                            sortDirection={sortDirection}
                            getGrade={getGrade}
                            onUserClick={onUserClick}
                            currentMonth={currentMonth}
                            workingDaysCount={workingDaysCount}
                            lateViewMode={lateViewMode}
                            otViewMode={otViewMode}
                          />
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardTable;
export type { UserStat, DashboardTableProps };
