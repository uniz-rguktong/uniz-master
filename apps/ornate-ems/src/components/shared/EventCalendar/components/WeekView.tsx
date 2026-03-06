import type { CalendarEvent } from '../types';

interface WeekViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
    const timeSlots = [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
        '6:00 PM', '7:00 PM', '8:00 PM'
    ];

    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay()); // Sunday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentDate);

    const getEventStyle = (event: CalendarEvent) => {
        if (!event.time) {
            return {
                top: '0px',
                height: '60px',
                backgroundColor: event.categoryColor || '#3B82F6'
            };
        }
        // Simple parsing to determine start row and duration
        const timeParts = event.time?.split('-');
        if (!timeParts || timeParts.length === 0) {
            return {
                top: '0px',
                height: '60px',
                backgroundColor: event.categoryColor || '#3B82F6'
            };
        }

        const startTimeParts = timeParts[0]?.trim().split(' ');
        if (!startTimeParts || startTimeParts.length < 2) {
            return {
                top: '0px',
                height: '60px',
                backgroundColor: event.categoryColor || '#3B82F6'
            };
        }

        let startHour = parseInt(startTimeParts[0]!.split(':')[0] || '0');
        if (startTimeParts[1] === 'PM' && startHour !== 12) startHour += 12;
        if (startTimeParts[1] === 'AM' && startHour === 12) startHour = 0;

        // Assume start of day is 8 AM
        const offset = startHour - 8;
        const top = Math.max(0, offset * 60); // 60px per hour

        return {
            top: `${top}px`,
            height: '60px', // Default height
            backgroundColor: event.categoryColor || '#3B82F6'
        };
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="flex bg-white min-h-[600px] min-w-[800px] overflow-hidden">
                {/* Time Scale */}
                <div className="w-20 shrink-0 border-r border-[#E5E7EB]">
                    <div className="h-12 border-b border-[#E5E7EB]"></div>
                    {timeSlots.map((time: any) => (
                        <div key={time} className="h-[60px] text-xs text-[#6B7280] text-right pr-2 pt-2 relative">
                            <span className="relative z-10 bg-white pl-1">{time}</span>
                            <div className="absolute top-0 right-0 w-full border-t border-[#E5E7EB] border-dashed"></div>
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 overflow-x-auto">
                    {weekDays.map((day: any, i: any) => (
                        <div key={i} className="min-w-[120px] border-r border-[#E5E7EB] last:border-r-0 relative">
                            {/* Header */}
                            <div className="h-12 border-b border-[#E5E7EB] bg-[#F7F8FA] flex flex-col items-center justify-center">
                                <span className="text-xs text-[#6B7280] uppercase font-medium">
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mt-0.5 ${day.toDateString() === new Date().toDateString() ?
                                    'bg-[#3B82F6] text-white' :
                                    'text-[#1A1A1A]'}`
                                }>
                                    {day.getDate()}
                                </div>
                            </div>

                            {/* Time Slots Background */}
                            <div className="relative h-[780px]"> {/* 13 slots * 60px */}
                                {timeSlots.map((_: any, index: any) => (
                                    <div key={index} className="h-[60px] border-b border-[#E5E7EB] border-dashed"></div>
                                ))}

                                {/* Events */}
                                {events
                                    .filter((e: any) => e.date === day.toISOString().split('T')[0])
                                    .map((event: any) => (
                                        <div
                                            key={event.id}
                                            className="absolute left-1 right-1 rounded p-2 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity shrink-0 z-10 overflow-hidden"
                                            style={getEventStyle(event)}
                                            title={`${event.title} (${event.time})`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
                                            }}>
                                            <div className="font-semibold truncate">{event.title}</div>
                                            <div className="truncate opacity-90">{event.time}</div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
