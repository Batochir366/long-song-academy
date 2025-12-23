"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateDailySlots, formatTime } from "@/lib/slotHelpers";
import { Trash2, Plus, Check, X, User } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import apiClient from "@/lib/axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type TimeSlot = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

type Booking = {
  _id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    email?: string;
    photo?: string;
  };
};

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [existingSlots, setExistingSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Fetch existing slots for selected date
  const fetchSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      const [slotsResponse, bookingsResponse] = await Promise.all([
        apiClient.get("/api/timeslots", {
          params: { date: dateStr },
        }),
        apiClient.get("/api/bookings", {
          params: { date: dateStr },
        }),
      ]);

      const slots = slotsResponse.data.slots || [];
      const bookingsData = bookingsResponse.data.bookings || [];

      setExistingSlots(slots);
      setBookings(bookingsData);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to load slots";
      toast.error("Failed to load data", {
        description: errorMsg,
      });
      setExistingSlots([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load slots when date changes
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  // Generate full day slots (06:00-18:40, 40min lesson + 20min break)
  const handleGenerateFullDay = () => {
    const dateStr = formatDate(selectedDate);
    const slots = generateDailySlots(dateStr, 6, 19, 40, 20);

    // Convert to format for selection
    const slotKeys = slots.map((slot) => `${slot.startTime}-${slot.endTime}`);
    setSelectedSlots(slotKeys);

    toast.info("Full day generated", {
      description: `${slotKeys.length} time slots selected`,
    });
  };

  // Toggle slot selection
  const toggleSlot = (slotKey: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotKey)
        ? prev.filter((s) => s !== slotKey)
        : [...prev, slotKey]
    );
  };

  // Create selected slots
  const handleCreateSlots = async () => {
    if (selectedSlots.length === 0) {
      toast.error("No slots selected", {
        description: "Please select at least one time slot",
      });
      return;
    }

    setLoading(true);

    try {
      const dateStr = formatDate(selectedDate);
      const slotsToCreate = selectedSlots.map((slotKey) => {
        const [startTime, endTime] = slotKey.split("-");
        return {
          date: dateStr,
          startTime,
          endTime,
        };
      });

      const response = await apiClient.post("/api/timeslots", {
        slots: slotsToCreate,
      });

      const createdCount = response.data.slots?.length || 0;
      toast.success("Slots created successfully", {
        description: `${createdCount} time slot${
          createdCount > 1 ? "s" : ""
        } created for ${dateStr}`,
      });

      setSelectedSlots([]);
      await fetchSlots(selectedDate); // Refresh slots
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to create slots";
      toast.error("Failed to create slots", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (slotId: string, slotTime: string) => {
    toast("Delete time slot?", {
      description: `This will permanently delete the ${slotTime} slot`,
      action: {
        label: "Delete",
        onClick: async () => {
          setLoading(true);
          try {
            await apiClient.delete(`/api/timeslots/${slotId}`);

            toast.success("Slot deleted successfully", {
              description: `${slotTime} slot has been removed`,
            });
            await fetchSlots(selectedDate); // Refresh slots
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.error ||
              err.message ||
              "Failed to delete slot";
            toast.error("Failed to delete slot", {
              description: errorMsg,
            });
          } finally {
            setLoading(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.info("Deletion cancelled"),
      },
    });
  };

  // Cancel booking
  const handleCancelBooking = async (
    bookingId: string,
    userName: string,
    slotTime: string
  ) => {
    toast("Cancel booking?", {
      description: `This will cancel ${userName}'s booking for ${slotTime}`,
      action: {
        label: "Cancel Booking",
        onClick: async () => {
          setLoading(true);
          try {
            await apiClient.patch(`/api/bookings/${bookingId}`, {
              status: "canceled",
            });

            toast.success("Booking cancelled", {
              description: `${userName}'s booking for ${slotTime} has been cancelled`,
            });
            // Refresh slots and bookings after cancellation
            await fetchSlots(selectedDate);
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.error ||
              err.message ||
              "Failed to cancel booking";
            toast.error("Failed to cancel booking", {
              description: errorMsg,
            });
          } finally {
            setLoading(false);
          }
        },
      },
      cancel: {
        label: "Keep Booking",
        onClick: () => toast.info("Booking kept"),
      },
    });
  };

  // Get booking for a slot
  const getBookingForSlot = (slot: TimeSlot): Booking | undefined => {
    return bookings.find(
      (booking) =>
        booking.bookingDate === slot.date &&
        booking.startTime === slot.startTime &&
        booking.endTime === slot.endTime &&
        booking.status !== "cancelled"
    );
  };

  // Find duplicate slots for a specific time
  const findDuplicates = (
    date: string,
    startTime: string,
    endTime: string
  ): TimeSlot[] => {
    return existingSlots.filter(
      (slot) =>
        slot.date === date &&
        slot.startTime === startTime &&
        slot.endTime === endTime
    );
  };

  // Delete duplicate slots
  const handleDeleteDuplicates = async (
    date: string,
    startTime: string,
    endTime: string,
    duplicateCount: number
  ) => {
    const slotTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;

    toast("Delete duplicate slots?", {
      description: `This will delete ${duplicateCount} duplicate slot(s) for ${slotTime}`,
      action: {
        label: "Delete Duplicates",
        onClick: async () => {
          setLoading(true);
          try {
            const response = await apiClient.delete(
              `/api/timeslots/duplicates/${date}/${startTime}/${endTime}`
            );

            const deletedCount = response.data.deleted || 0;
            toast.success("Duplicates deleted", {
              description:
                response.data.message ||
                `Deleted ${deletedCount} duplicate slot(s) for ${slotTime}`,
            });
            await fetchSlots(selectedDate); // Refresh slots
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.error ||
              err.message ||
              "Failed to delete duplicates";
            toast.error("Failed to delete duplicates", {
              description: errorMsg,
            });
          } finally {
            setLoading(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.info("Deletion cancelled"),
      },
    });
  };

  // Generate available slot options for the day
  const availableSlotOptions = generateDailySlots(
    formatDate(selectedDate),
    6,
    19,
    40,
    20
  );

  // Filter out slots that already exist
  const availableToCreate = availableSlotOptions.filter((slot) => {
    return !existingSlots.some(
      (existing) =>
        existing.startTime === slot.startTime &&
        existing.endTime === slot.endTime
    );
  });

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <h1 className="text-3xl font-bold mb-6">Time Slot Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    onChange={(value) => {
                      const date = Array.isArray(value) ? value[0] : value;
                      if (date) setSelectedDate(date);
                    }}
                    value={selectedDate}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Slot Creation Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Time Slots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateFullDay}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Full Day
                    </Button>
                  </div>

                  {/* Available slots to create */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <p className="text-sm font-medium text-muted-foreground">
                      Select slots to create:
                    </p>
                    {availableToCreate.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        All slots for this day have been created.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {availableToCreate.map((slot) => {
                          const slotKey = `${slot.startTime}-${slot.endTime}`;
                          const isSelected = selectedSlots.includes(slotKey);
                          return (
                            <button
                              key={slotKey}
                              onClick={() => toggleSlot(slotKey)}
                              disabled={loading}
                              className={`
                          p-3 rounded-md border text-left transition-all
                          ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-accent border-border"
                          }
                        `}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {formatTime(slot.startTime)} -{" "}
                                  {formatTime(slot.endTime)}
                                </span>
                                {isSelected && <Check className="w-4 h-4" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedSlots.length > 0 && (
                    <Button
                      onClick={handleCreateSlots}
                      className="w-full"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create {selectedSlots.length} Slot(s)
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Existing Slots Section */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Existing Slots ({formatDate(selectedDate)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading && existingSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : existingSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No slots created for this date.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {existingSlots.map((slot) => {
                        const booking = getBookingForSlot(slot);
                        const duplicates = findDuplicates(
                          slot.date,
                          slot.startTime,
                          slot.endTime
                        );
                        const isDuplicate = duplicates.length > 1;
                        return (
                          <div
                            key={slot._id}
                            className={`
                      p-3 rounded-md border
                      ${
                        slot.isBooked
                          ? "bg-muted border-muted-foreground/20"
                          : isDuplicate
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-background border-border"
                      }
                    `}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">
                                    {formatTime(slot.startTime)} -{" "}
                                    {formatTime(slot.endTime)}
                                  </span>
                                  {slot.isBooked ? (
                                    <Badge variant="secondary">Booked</Badge>
                                  ) : (
                                    <Badge variant="outline">Available</Badge>
                                  )}
                                  {isDuplicate && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Duplicate ({duplicates.length})
                                    </Badge>
                                  )}
                                </div>
                                {booking && booking.user && (
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <div className="flex items-center gap-2">
                                      {booking.user.photo ? (
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage
                                            src={booking.user.photo}
                                            alt={
                                              booking.user.firstName ||
                                              booking.user.userName ||
                                              "User"
                                            }
                                          />
                                          <AvatarFallback>
                                            {(
                                              booking.user.firstName?.[0] ||
                                              booking.user.userName?.[0] ||
                                              "U"
                                            ).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      ) : (
                                        <User className="w-3 h-3" />
                                      )}
                                      <span>
                                        {booking.user.firstName ||
                                        booking.user.lastName
                                          ? `${booking.user.firstName || ""} ${
                                              booking.user.lastName || ""
                                            }`.trim()
                                          : booking.user.userName || "User"}
                                      </span>
                                    </div>
                                    {booking.user.email && (
                                      <div className="text-xs ml-5">
                                        {booking.user.email}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {booking.status}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {isDuplicate && !slot.isBooked && (
                                  <Button
                                    onClick={() =>
                                      handleDeleteDuplicates(
                                        slot.date,
                                        slot.startTime,
                                        slot.endTime,
                                        duplicates.length
                                      )
                                    }
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                    title="Delete all duplicates"
                                    className="text-xs"
                                  >
                                    Delete Duplicates
                                  </Button>
                                )}
                                {booking && (
                                  <Button
                                    onClick={() => {
                                      const userName =
                                        booking.user.firstName ||
                                        booking.user.lastName
                                          ? `${booking.user.firstName || ""} ${
                                              booking.user.lastName || ""
                                            }`.trim()
                                          : booking.user.userName || "User";
                                      const slotTime = `${formatTime(
                                        slot.startTime
                                      )}-${formatTime(slot.endTime)}`;
                                      handleCancelBooking(
                                        booking._id,
                                        userName,
                                        slotTime
                                      );
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    disabled={loading}
                                    title="Cancel booking"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  onClick={() => {
                                    if (slot.isBooked) {
                                      toast.warning(
                                        "Cannot delete booked slot",
                                        {
                                          description:
                                            "This slot has an active booking",
                                        }
                                      );
                                    } else {
                                      handleDeleteSlot(
                                        slot._id,
                                        `${formatTime(
                                          slot.startTime
                                        )}-${formatTime(slot.endTime)}`
                                      );
                                    }
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  disabled={loading}
                                  title={
                                    slot.isBooked
                                      ? "Cannot delete booked slot"
                                      : "Delete slot"
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
