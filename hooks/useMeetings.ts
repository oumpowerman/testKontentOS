
import { useMeetingContext } from '../context/MeetingContext';

export const useMeetings = () => {
    const context = useMeetingContext();
    
    return {
        meetings: context.meetings,
        historyMeetings: context.historyMeetings,
        isLoading: context.isLoading,
        isHistoryLoading: context.isHistoryLoading,
        hasMore: context.hasMore,
        historyHasMore: context.historyHasMore,
        currentMonth: context.currentMonth,
        setCurrentMonth: context.setCurrentMonth,
        fetchMeetingDetail: context.fetchMeetingDetail,
        loadMoreMeetings: context.loadMoreMeetings,
        loadMoreHistory: context.loadMoreHistory,
        createMeeting: context.createMeeting,
        updateMeeting: context.updateMeeting,
        deleteMeeting: context.deleteMeeting
    };
};
