import { MATCH_STATUS } from "../validation/matches";

export const getMatchStatus = (startTime: string, endTime?: string, now = new Date()) => {
    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) {
        return null;
    }

    if (now < start) {
        return MATCH_STATUS.SCHEDULED;
    }

    if (endTime) {
        const end = new Date(endTime);
        if (!Number.isNaN(end.getTime()) && now > end) {
            return MATCH_STATUS.FINISHED;
        }
    }

    return MATCH_STATUS.LIVE;
}