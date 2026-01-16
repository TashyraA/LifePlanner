import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  time?: string;
  description?: string;
  completed?: boolean;
}

interface CustomCalendarProps {
  month: number;
  year: number;
  events: CalendarEvent[];
  onAddEvent: (event: { title: string; time: string; description: string; date: Date }) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  month,
  year,
  events,
  onAddEvent,
  onDeleteEvent,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', description: '' });

  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();

  // Create array of days with empty slots for alignment
  const calendarDays = Array(firstDayOfWeek).fill(null).concat(daysInMonth);

  const handleDayClick = (date: Date, e: React.MouseEvent) => {
    // Check if clicking on an event
    const target = e.target as HTMLElement;
    if (target.closest('.event-badge')) {
      return; // Let event click handler handle it
    }
    
    setSelectedDate(date);
    setIsAddEventOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleAddEvent = () => {
    if (newEvent.title && selectedDate) {
      onAddEvent({
        ...newEvent,
        date: selectedDate,
      });
      setNewEvent({ title: '', time: '', description: '' });
      setIsAddEventOpen(false);
    }
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date) && !event.completed);
  };

  const convertTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-coquette-brown-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayEvents = getEventsForDay(date);
          const isToday = isSameDay(date, new Date());

          return (
            <div
              key={index}
              onClick={(e) => handleDayClick(date, e)}
              className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                isToday
                  ? 'border-coquette-pink-400 bg-coquette-pink-50'
                  : 'border-coquette-brown-200 bg-white hover:bg-coquette-pink-50'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-coquette-pink-500' : 'text-coquette-brown-600'}`}>
                  {format(date, 'd')}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className="event-badge text-xs bg-coquette-pink-200 text-coquette-brown-600 px-1 py-0.5 rounded truncate hover:bg-coquette-pink-300 transition-colors cursor-pointer"
                      title={event.title}
                    >
                      {event.time && <span className="font-semibold">{convertTo12Hour(event.time)} </span>}
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-coquette-brown-600">
              Add Event - {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="border-coquette-brown-200"
              />
            </div>
            <div>
              <Label>Time (optional)</Label>
              <Input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="border-coquette-brown-200"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="border-coquette-brown-200"
                rows={3}
              />
            </div>
            <Button
              onClick={handleAddEvent}
              className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
            >
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-coquette-brown-600">Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-coquette-brown-600">{selectedEvent.title}</h3>
                <p className="text-sm text-coquette-brown-500">
                  {format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                  {selectedEvent.time && ` at ${convertTo12Hour(selectedEvent.time)}`}
                </p>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <Label className="text-coquette-brown-600">Description</Label>
                  <p className="text-sm text-coquette-brown-500 mt-1 p-3 bg-coquette-pink-50 rounded-lg">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onDeleteEvent(selectedEvent.id);
                    setIsEventDetailOpen(false);
                  }}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
                >
                  Delete Event
                </Button>
                <Button
                  onClick={() => setIsEventDetailOpen(false)}
                  className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};