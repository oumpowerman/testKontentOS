import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TableGroup } from "../types";

interface TableGroupRowProps {
  group: TableGroup;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const TableGroupRow: React.FC<TableGroupRowProps> = ({
  group,
  count,
  isCollapsed,
  onToggle,
}) => {
  return (
    <tr
      className={`${group.bg} cursor-pointer border-y border-gray-100 select-none transition-all`}
      onClick={onToggle}
    >
      <td colSpan={8} className="px-6 py-3 font-bold text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{group.title}</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs font-bold">
              {count} คน
            </span>
          </div>
          <div className="text-gray-400">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};
