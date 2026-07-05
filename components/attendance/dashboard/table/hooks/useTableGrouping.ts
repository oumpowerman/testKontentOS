import { useMemo } from "react";
import { User } from "../../../../../types";
import { UserStat, GroupMode, TableGroup } from "../types";

interface UseTableGroupingParams {
  filteredStats: UserStat[];
  users: User[];
  groupMode: GroupMode;
  sortDirection: "ASC" | "DESC";
  activeStatFilter?: string;
  lateViewMode?: "DAYS" | "HOURS";
}

export const useTableGrouping = ({
  filteredStats,
  users,
  groupMode,
  sortDirection,
  activeStatFilter,
  lateViewMode = "DAYS",
}: UseTableGroupingParams) => {
  return useMemo(() => {
    const getSortValue = (stat: UserStat) => {
      if (activeStatFilter === "LATE") {
        return lateViewMode === "HOURS" ? (stat.totalLateMinutes || 0) : stat.late;
      }
      if (activeStatFilter === "ABSENT") return stat.absent;
      if (activeStatFilter === "LEAVE") return stat.leaves;
      return stat.present;
    };

    const grouped: Record<string, UserStat[]> = {};

    if (groupMode === "NONE") {
      const sortedAll = [...filteredStats].sort((a, b) => {
        const valA = getSortValue(a);
        const valB = getSortValue(b);
        if (sortDirection === "ASC") {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });

      return {
        groups: [
          { id: "ALL_EMPLOYEES", title: "รายชื่อพนักงานทั้งหมด", bg: "" },
        ] as TableGroup[],
        groupedData: { ALL_EMPLOYEES: sortedAll } as Record<string, UserStat[]>,
      };
    }

    const groupKeySet = new Set<string>();

    filteredStats.forEach((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      let groupKey = "";

      if (groupMode === "POSITION") {
        groupKey = user?.position?.trim() || "ไม่ระบุตำแหน่ง";
      } else if (groupMode === "EMPLOYMENT_TYPE") {
        const empType = user?.employmentType;
        if (empType === "FULL_TIME") groupKey = "💼 พนักงานประจำ (Full-Time)";
        else if (empType === "PROBATION")
          groupKey = "📋 พนักงานทดลองงาน (Probation)";
        else if (empType === "INTERN") groupKey = "🎓 นักศึกษาฝึกงาน (Intern)";
        else groupKey = "ไม่ระบุประเภทการจ้างงาน";
      }

      groupKeySet.add(groupKey);

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(stat);
    });

    const colorPalettes = [
      "bg-indigo-50/60 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50",
      "bg-amber-50/60 text-amber-700 border-amber-100 hover:bg-amber-100/50",
      "bg-emerald-50/60 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50",
      "bg-sky-50/60 text-sky-700 border-sky-100 hover:bg-sky-100/50",
      "bg-purple-50/60 text-purple-700 border-purple-100 hover:bg-purple-100/50",
      "bg-rose-50/60 text-rose-700 border-rose-100 hover:bg-rose-100/50",
      "bg-teal-50/60 text-teal-700 border-teal-100 hover:bg-teal-100/50",
      "bg-orange-50/60 text-orange-700 border-orange-100 hover:bg-orange-100/50",
    ];

    const sortedGroupKeys = Array.from(groupKeySet).sort((a, b) => {
      if (a.includes("ไม่ระบุ")) return 1;
      if (b.includes("ไม่ระบุ")) return -1;
      return a.localeCompare(b, "th");
    });

    const computedGroups: TableGroup[] = sortedGroupKeys.map((key, index) => ({
      id: key,
      title: key,
      bg: colorPalettes[index % colorPalettes.length],
    }));

    const sortedGroupedData: Record<string, UserStat[]> = {};
    Object.keys(grouped).forEach((key) => {
      sortedGroupedData[key] = [...grouped[key]].sort((a, b) => {
        const valA = getSortValue(a);
        const valB = getSortValue(b);
        if (sortDirection === "ASC") {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
    });

    return { groups: computedGroups, groupedData: sortedGroupedData };
  }, [filteredStats, users, groupMode, sortDirection, activeStatFilter, lateViewMode]);
};
