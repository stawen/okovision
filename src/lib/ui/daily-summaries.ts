import { isValidDay, shiftDay } from '../utils/dates.ts';

export function summaryDays(start: string, end: string, latest: string): string[] | null {
	if (!isValidDay(start) || !isValidDay(end) || start > end || end > latest) return null;
	const days: string[] = [];
	for (let day = start; day <= end; day = shiftDay(day, 1)) days.push(day);
	return days;
}
