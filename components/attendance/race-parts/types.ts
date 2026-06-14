import { User } from '../../../types/core';

export interface RacetrackActiveUser {
    user: User;
    isCheckedIn: boolean;
    checkInTime: string | null;
    checkInOrder: number; // 1 = first, 2 = second, etc.
    status: string;
}
