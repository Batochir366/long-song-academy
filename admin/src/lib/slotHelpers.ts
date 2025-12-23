/**
 * Helper functions for generating and managing time slots
 */

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBooked?: boolean;
}

/**
 * Generate time slots for a given day
 * @param date - Date string in YYYY-MM-DD format
 * @param startHour - Start hour (default: 6 for 06:00)
 * @param endHour - End hour (default: 19 for 19:00, allows slots up to 18:40)
 * @param lessonDurationMinutes - Lesson duration in minutes (default: 40)
 * @param breakDurationMinutes - Break between lessons in minutes (default: 20)
 * @returns Array of time slots
 */
export function generateDailySlots(
  date: string,
  startHour: number = 6,
  endHour: number = 19,
  lessonDurationMinutes: number = 40,
  breakDurationMinutes: number = 20
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = lessonDurationMinutes + breakDurationMinutes; // Total slot duration (60 minutes)

  let currentHour = startHour;
  let currentMinute = 0;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute === 0)
  ) {
    // Calculate start time
    const startTimeString = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinute
    ).padStart(2, "0")}`;

    // Calculate end time (start + lesson duration)
    let slotEndHour = currentHour;
    let slotEndMinute = currentMinute + lessonDurationMinutes;

    // Handle minute overflow
    while (slotEndMinute >= 60) {
      slotEndMinute -= 60;
      slotEndHour += 1;
    }

    // Check if end time exceeds the day end
    if (
      slotEndHour > endHour ||
      (slotEndHour === endHour && slotEndMinute > 0)
    ) {
      break;
    }

    const endTimeString = `${String(slotEndHour).padStart(2, "0")}:${String(
      slotEndMinute
    ).padStart(2, "0")}`;

    slots.push({
      date,
      startTime: startTimeString,
      endTime: endTimeString,
      isBooked: false,
    });

    // Move to next slot (add break duration)
    currentMinute += slotDuration;
    while (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }
  }

  return slots;
}

/**
 * Format time string for display
 * @param time - Time string in HH:mm format
 * @returns Formatted time string (e.g., "8:00 AM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

/**
 * Validate time slot format
 * @param slot - Time slot object
 * @returns true if valid, false otherwise
 */
export function validateSlot(slot: Partial<TimeSlot>): boolean {
  if (!slot.date || !slot.startTime || !slot.endTime) {
    return false;
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(slot.date)) {
    return false;
  }

  // Validate time format (HH:mm)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
    return false;
  }

  // Validate end time is after start time
  const [startHour, startMinute] = slot.startTime.split(":").map(Number);
  const [endHour, endMinute] = slot.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return endMinutes > startMinutes;
}
