import { User } from "../../../../types";
import { AttendanceLog } from "../../../../types/attendance";

export interface UserStat {
  userId: string;
  present: number;
  late: number;
  leaves: number;
  absent: number;
  totalHours: number;
  avgCheckIn: string;
  logs: AttendanceLog[];
  totalLateMinutes?: number;
  totalOtHours?: number;
  totalOtPayout?: number;
}

export type GroupMode = "POSITION" | "EMPLOYMENT_TYPE" | "NONE";

export interface TableGroup {
  id: string;
  title: string;
  bg: string;
}

export interface DashboardTableProps {
  isLoading: boolean;
  filteredStats: UserStat[];
  users: User[];
  getGrade: (stat: UserStat) => { grade: string; color: string };
  onUserClick: (user: User, stat: UserStat) => void;
  activeStatFilter?: string;
  sortDirection: "ASC" | "DESC";
  onSortDirectionChange: (dir: "ASC" | "DESC") => void;
  currentMonth?: Date;
  workingDaysCount?: number;
  lateViewMode?: "DAYS" | "HOURS";
  onLateViewModeChange?: (mode: "DAYS" | "HOURS") => void;
  otViewMode?: "HOURS" | "PAYOUT";
  onOtViewModeChange?: (mode: "HOURS" | "PAYOUT") => void;
}
