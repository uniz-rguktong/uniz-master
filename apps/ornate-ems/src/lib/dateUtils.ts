export function formatTimeTo12h(timeStr: string | null | undefined): string {
    if (!timeStr) return 'TBD';

    // If it's a range (e.g., "12:00 - 15:00"), format each part
    if (timeStr.includes(' - ')) {
        const parts = timeStr.split(' - ');
        return parts.map(p => formatTimeTo12h(p.trim())).join(' - ');
    }

    // Check if it's already in 12h format (contains AM or PM)
    if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
        return timeStr;
    }

    // Try to parse HH:mm or HH:mm:ss
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match && match[1] && match[2]) {
        let hours = match[1];
        let minutes = match[2];
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${minutes} ${ampm}`;
    }

    // Fallback: If it's a full date string, parse it
    try {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime()) && timeStr.includes('T')) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
    } catch (e) {
        // ignore
    }

    return timeStr;
}

export function formatDateTimeTo12h(date: Date | string | null | undefined): string {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'TBD';

    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
