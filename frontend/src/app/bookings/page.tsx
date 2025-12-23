"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { formatTime } from "@/lib/slotHelpers";
import {
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

type TimeSlot = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type Booking = {
  _id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  timeSlotId?: string;
};

export default function StudentBookingsPage() {
  const { user, isLoaded } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Fetch available slots for selected date
  const fetchAvailableSlots = async (date: Date | undefined) => {
    if (!date) return;
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      const response = await apiClient.get("/api/timeslots", {
        params: { date: dateStr },
      });

      // Filter to only show available (not booked) slots
      const available = (response.data.slots || []).filter(
        (slot: TimeSlot) => !slot.isBooked
      );
      setAvailableSlots(available);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        "Боломжтой цагууд ачааллахад алдаа гарлаа";
      toast.error("Цаг ачааллахад алдаа гарлаа", {
        description: errorMsg,
      });
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all dates that have available slots (for the next 30 days)
  const fetchDatesWithSlots = async () => {
    try {
      // Calculate date range
      const startDate = new Date(today);
      const endDate = new Date(maxDate);

      // Fetch all slots without date filter (or with date range if backend supports it)
      // For now, we'll fetch all slots and filter client-side
      const response = await apiClient.get("/api/timeslots");
      const allSlots = response.data?.slots || [];

      // Filter slots within our date range and check for available slots
      const datesWithAvailableSlots = new Set<string>();

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = formatDate(d);
        const slotsForDate = allSlots.filter(
          (slot: TimeSlot) => slot.date === dateStr && !slot.isBooked
        );

        if (slotsForDate.length > 0) {
          datesWithAvailableSlots.add(dateStr);
        }
      }

      setDatesWithSlots(datesWithAvailableSlots);
    } catch (err: any) {
      console.error("Failed to fetch dates with slots:", err);
      // Don't set error state here, just log it
    }
  };

  // Fetch user's bookings
  const fetchMyBookings = async () => {
    if (!isLoaded || !user) return;

    try {
      // First get user from backend by clerkId
      const userResponse = await apiClient.get("/api/users", {
        params: { clerkId: user.id },
      });

      if (userResponse.data.users && userResponse.data.users.length > 0) {
        const dbUser = userResponse.data.users[0];
        const bookingsResponse = await apiClient.get("/api/bookings", {
          params: { userId: dbUser._id },
        });
        setMyBookings(bookingsResponse.data.bookings || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch user bookings:", err);
    }
  };

  // Fetch slots for current date on initial mount and when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]); // This will run on mount since selectedDate is initialized with new Date()

  // Load user's bookings on mount
  useEffect(() => {
    fetchMyBookings();
  }, [isLoaded, user]);

  // Fetch dates with slots on mount and when month changes
  useEffect(() => {
    fetchDatesWithSlots();
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const newMonthStart = new Date(
      newMonth.getFullYear(),
      newMonth.getMonth(),
      1
    );
    if (newMonthStart >= currentMonthStart) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Book a slot
  const handleBookSlot = async (slotId: string) => {
    if (!isLoaded || !user) {
      toast.error("Цаг захиалахын тулд нэвтэрнэ үү", {
        description: "Захиалга хийхийн тулд нэвтрэх шаардлагатай",
      });
      return;
    }

    setBookingLoading(slotId);

    try {
      const response = await apiClient.post("/api/bookings", {
        timeSlotId: slotId,
        clerkId: user.id,
      });

      const startTime = formatTime(
        response.data.booking.timeSlotId?.startTime ||
          response.data.booking.startTime
      );
      const endTime = formatTime(
        response.data.booking.timeSlotId?.endTime ||
          response.data.booking.endTime
      );

      toast.success("Захиалга баталгаажлаа!", {
        description: `Таны хичээл ${startTime} - ${endTime} цагт товлогдлоо`,
      });

      await fetchAvailableSlots(selectedDate); // Refresh slots
      await fetchMyBookings(); // Refresh my bookings
      await fetchDatesWithSlots(); // Refresh available dates
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Захиалга амжилтгүй боллоо";
      toast.error("Захиалга амжилтгүй", {
        description: errorMsg,
      });
    } finally {
      setBookingLoading(null);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    toast("Захиалгыг цуцлах уу?", {
      action: {
        label: "Захиалга цуцлах",
        onClick: async () => {
          setCancelLoading(bookingId);
          try {
            await apiClient.patch(`/api/bookings/${bookingId}`, {
              status: "canceled",
            });

            toast.success("Захиалга цуцлагдлаа", {
              description: "Таны захиалга амжилттай цуцлагдлаа",
            });

            // Refresh slots and bookings after cancellation
            if (selectedDate) {
              await fetchAvailableSlots(selectedDate);
            }
            await fetchMyBookings();
            await fetchDatesWithSlots(); // Refresh available dates
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.error ||
              err.message ||
              "Захиалга цуцлах амжилтгүй боллоо";
            toast.error("Цуцлалт амжилтгүй", {
              description: errorMsg,
            });
          } finally {
            setCancelLoading(null);
          }
        },
      },
      cancel: {
        label: "Захиалгыг үлдээх",
        onClick: () => toast.info("Захиалга хадгалагдлаа"),
      },
    });
  };

  return (
    <div className="min-h-screen">
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="font-serif text-5xl md:text-6xl mb-6 text-foreground">
            Хувийн хичээл цаг захиалах
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mb-8">
            40 минутын хувийн хичээл авахын тулд огноо, цагаа сонгоно уу.
          </p>

          <Card className="border-border bg-card mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:gap-8">
                {/* Calendar Section */}
                <div className="flex-1 mb-8 md:mb-0 flex flex-col items-center w-full">
                  <div className="flex flex-col items-center w-full">
                    {/* Arrows + Month */}
                    <div className="flex w-full max-w-md justify-between items-center px-4 py-2 bg-accent/20 rounded-lg mb-4">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={goToPreviousMonth}
                        disabled={
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            1
                          ) <=
                          new Date(today.getFullYear(), today.getMonth(), 1)
                        }
                        className="h-12 w-12 rounded-full"
                      >
                        <ChevronLeft className="h-7 w-7" />
                      </Button>

                      {/* Month text */}
                      <p className="text-lg font-serif text-card-foreground text-center flex-1">
                        {currentMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>

                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={goToNextMonth}
                        className="h-12 w-12 rounded-full"
                      >
                        <ChevronRight className="h-7 w-7" />
                      </Button>
                    </div>

                    {/* Calendar */}
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      month={currentMonth}
                      onMonthChange={(newMonth) => {
                        const currentMonthStart = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          1
                        );
                        const newMonthStart = new Date(
                          newMonth.getFullYear(),
                          newMonth.getMonth(),
                          1
                        );
                        if (newMonthStart >= currentMonthStart) {
                          setCurrentMonth(newMonth);
                        }
                      }}
                      disabled={(date) => {
                        // Disable dates outside valid range
                        if (date < today || date > maxDate) {
                          return true;
                        }
                        // Disable dates that don't have any available slots
                        const dateStr = formatDate(date);
                        return !datesWithSlots.has(dateStr);
                      }}
                      className="rounded-md border-0"
                      classNames={{
                        months:
                          "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "hidden",
                        caption_label: "hidden",
                        nav: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell:
                          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md text-card-foreground",
                        day_today:
                          "border-2 border-[#8B6F47] text-card-foreground bg-transparent rounded-md aria-selected:border-transparent",
                        day_selected:
                          "bg-[#8B6F47] text-white font-medium rounded-md hover:bg-[#8B6F47] hover:text-white focus:bg-[#8B6F47] focus:text-white",
                        day_outside:
                          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                        day_disabled:
                          "text-muted-foreground opacity-30 cursor-not-allowed",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </div>

                {/* Time Slots Section */}
                <div className="flex-1 border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
                  <h3 className="font-serif text-2xl text-card-foreground mb-2 text-center md:text-left">
                    Боломжтой цагууд
                  </h3>

                  {selectedDate && (
                    <p className="text-sm text-muted-foreground mb-6 text-center md:text-left">
                      {selectedDate.toLocaleDateString("mn-MN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Боломжтой цагууд ачааллаж байна...
                      </p>
                    </div>
                  ) : !selectedDate ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Хуанлигаас огноо сонгоно уу
                      </p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Энэ өдөр боломжтой цаг байхгүй байна. Өөр өдөр сонгоно
                        уу.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot._id}
                          variant="outline"
                          disabled={bookingLoading === slot._id}
                          onClick={() => handleBookSlot(slot._id)}
                          className="rounded-full relative"
                        >
                          {bookingLoading === slot._id ? (
                            "Захиалж байна..."
                          ) : (
                            <>
                              {formatTime(slot.startTime)} -{" "}
                              {formatTime(slot.endTime)}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Bookings Section */}
          {isLoaded && user && myBookings.length > 0 && (
            <div className="mb-12">
              <h2 className="font-serif text-3xl md:text-4xl mb-8 text-foreground">
                Миний захиалгууд
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBookings
                  .filter((b) => b.status !== "cancelled")
                  .map((booking) => (
                    <Card key={booking._id} className="border-border bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-serif text-xl text-card-foreground mb-2">
                              {formatTime(booking.startTime)} -{" "}
                              {formatTime(booking.endTime)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.bookingDate).toLocaleDateString(
                                "mn-MN",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          <Badge
                            variant={
                              booking.status === "approved" ||
                              booking.status === "booked"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {booking.status === "approved"
                              ? "Батлагдсан"
                              : booking.status === "booked"
                              ? "Захиалсан"
                              : booking.status === "pending"
                              ? "Хүлээгдэж байна"
                              : booking.status}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleCancelBooking(booking._id);
                          }}
                          disabled={cancelLoading === booking._id}
                          className="w-full"
                        >
                          {cancelLoading === booking._id ? (
                            "Цуцалж байна..."
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Захиалга цуцлах
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
