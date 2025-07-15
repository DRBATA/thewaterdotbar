"use client"

import { useState, useEffect } from 'react';
import { db, TimelineEvent } from '@/lib/client-db';
import { format } from 'date-fns';

export function HydrationTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const allEvents = await db.getAllTimelineEvents();
      // Sort by timestamp descending to show the latest events first
      allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setEvents(allEvents);
    };

    fetchEvents();

    // Optional: Could add a subscription to update in real-time
  }, []);

  const renderEventData = (event: TimelineEvent) => {
    switch (event.eventType) {
      case 'consumption':
        return (
          <p>
            Consumed <strong>{event.data.productName}</strong> ({event.data.quantity} {event.data.unit})
          </p>
        );
      case 'activity':
        return (
          <p>
            Activity: <strong>{event.data.activityName}</strong> for {event.data.duration_minutes} mins ({event.data.intensity})
          </p>
        );
      case 'measurement':
        return <p>Measurement: {JSON.stringify(event.data)}</p>;
      case 'state_change':
        return <p>State Change: {JSON.stringify(event.data)}</p>;
      default:
        return <p>Unknown event type</p>;
    }
  };

  if (events.length === 0) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-center text-slate-400">
        <p>No hydration events logged yet. Chat with the AI to add some!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Your Hydration Timeline</h3>
      <ul className="space-y-3">
        {events.map(event => (
          <li key={event.id} className="p-3 bg-slate-800/50 rounded-lg flex items-start gap-4">
            <div className="text-xs text-slate-400 whitespace-nowrap pt-1">
              {format(event.timestamp, 'HH:mm')}
            </div>
            <div className="flex-grow text-sm text-slate-200">
              {renderEventData(event)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
