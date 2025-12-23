"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateDailySlots, formatTime } from "@/lib/slotHelpers";
import { Trash2, Plus, Check } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
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

export default function AdminBookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [existingSlots, setExistingSlots] = useState<TimeSlot[]>([]);
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
      const response = await apiClient.get("/api/timeslots", {
        params: { date: dateStr },
      });

      const slots = response.data.slots || [];
      setExistingSlots(slots);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to load slots";
      toast.error("Failed to load slots", {
        description: errorMsg,
      });
      setExistingSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Load slots when date changes
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  // Generate full day slots (08:00-18:00, 40min lesson + 20min break)
  const handleGenerateFullDay = () => {
    const dateStr = formatDate(selectedDate);
    const slots = generateDailySlots(dateStr, 8, 18, 40, 20);

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
        onClick: () => {
          toast.info("Deletion cancelled");
        },
      },
    });
  };

  // Generate available slot options for the day
  const availableSlotOptions = generateDailySlots(
    formatDate(selectedDate),
    8,
    18,
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
                      {existingSlots.map((slot) => (
                        <div
                          key={slot._id}
                          className={`
                      p-3 rounded-md border flex items-center justify-between
                      ${
                        slot.isBooked
                          ? "bg-muted border-muted-foreground/20"
                          : "bg-background border-border"
                      }
                    `}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatTime(slot.startTime)} -{" "}
                                {formatTime(slot.endTime)}
                              </span>
                              {slot.isBooked ? (
                                <Badge variant="secondary">Booked</Badge>
                              ) : (
                                <Badge variant="outline">Available</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              if (slot.isBooked) {
                                toast.warning("Cannot delete booked slot", {
                                  description:
                                    "This slot has an active booking",
                                });
                              } else {
                                handleDeleteSlot(
                                  slot._id,
                                  `${formatTime(slot.startTime)}-${formatTime(
                                    slot.endTime
                                  )}`
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
                      ))}
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
