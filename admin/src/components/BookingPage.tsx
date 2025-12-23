"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Ban, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Booking {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  timeSlot: string;
  date: Date;
  status: "pending" | "accepted" | "cancelled";
  notes?: string;
  instrument?: string;
  instructor?: string;
  image: string;
}

interface TimeSlot {
  time: string;
  bookings: Booking[];
  status: "free" | "blocked";
}

// 🔹 Mock user list
const mockUsers = [
  {
    id: "u1",
    name: "Anu",
    email: "anu@example.com",
    phone: "+976 99112233",
    image: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    id: "u2",
    name: "Bat",
    email: "bat@example.com",
    phone: "+976 88112233",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    id: "u3",
    name: "Sara",
    email: "sara@example.com",
    phone: "+976 94112233",
    image: "https://randomuser.me/api/portraits/women/60.jpg",
  },
  {
    id: "u4",
    name: "Ganaa",
    email: "ganaa@example.com",
    phone: "+976 95113344",
    image: "https://randomuser.me/api/portraits/men/55.jpg",
  },
];

const formatTimeRange = (
  startHour: number,
  startMinutes: number,
  intervalMinutes: number
) => {
  const endMinutes = startMinutes + intervalMinutes;
  const endHour = startHour + Math.floor(endMinutes / 60);
  const finalEndMinutes = endMinutes % 60;

  const startTime = `${startHour.toString().padStart(2, "0")}:${startMinutes
    .toString()
    .padStart(2, "0")}`;
  const endTime = `${endHour.toString().padStart(2, "0")}:${finalEndMinutes
    .toString()
    .padStart(2, "0")}`;

  return `${startTime}-${endTime}`;
};

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 18;
  const lessonDuration = 40;
  const gapMinutes = 20;

  let currentHour = startHour;
  let currentMinutes = 0;

  while (currentHour < endHour) {
    const timeRange = formatTimeRange(
      currentHour,
      currentMinutes,
      lessonDuration
    );
    const slotDate = new Date(date);
    slotDate.setHours(currentHour, currentMinutes, 0, 0);

    const random = Math.random();

    slots.push({
      time: timeRange,
      bookings: [],
      status: random > 0.9 ? "blocked" : "free",
    });

    const totalMinutes = currentMinutes + lessonDuration + gapMinutes;
    currentHour = currentHour + Math.floor(totalMinutes / 60);
    currentMinutes = totalMinutes % 60;
  }

  return slots;
};

const getSlotStatusColor = (status: string) => {
  switch (status) {
    case "free":
      return "bg-green-50 border-green-200 text-green-800 hover:bg-green-100";
    case "blocked":
      return "bg-red-50 border-red-200 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100";
  }
};

const getSlotStatusIcon = (status: string) => {
  switch (status) {
    case "free":
      return <CheckCircle className="h-4 w-4" />;
    case "blocked":
      return <Ban className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [tempSlot, setTempSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const filteredUsers = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const slots = generateTimeSlots(selectedDate);
      setTimeSlots(slots);
      setIsLoading(false);
    }, 300);
  }, [selectedDate]);

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setTempSlot(JSON.parse(JSON.stringify(slot))); // deep clone

    if (slot.bookings.length > 0) {
      toast.info(`Time slot ${slot.time}`, {
        description: `${slot.bookings.length} booking${
          slot.bookings.length > 1 ? "s" : ""
        } in this slot`,
      });
    }
  };

  const handleTempSlotStatusChange = (newStatus: "free" | "blocked") => {
    setTempSlot((prev) => (prev ? { ...prev, status: newStatus } : prev));
    toast.info(`Slot status changed to ${newStatus}`, {
      description: "Don't forget to save your changes",
    });
  };

  const handleTempBookingStatusChange = (
    bookingId: string,
    newStatus: "pending" | "accepted" | "cancelled"
  ) => {
    const booking = tempSlot?.bookings.find((b) => b.id === bookingId);

    setTempSlot((prev) =>
      prev
        ? {
            ...prev,
            bookings: prev.bookings.map((b) =>
              b.id === bookingId ? { ...b, status: newStatus } : b
            ),
          }
        : prev
    );

    if (booking) {
      if (newStatus === "accepted") {
        toast.success(`Booking accepted`, {
          description: `${booking.studentName}'s booking is now accepted`,
        });
      } else if (newStatus === "cancelled") {
        toast.error(`Booking cancelled`, {
          description: `${booking.studentName}'s booking has been cancelled`,
        });
      } else {
        toast.info(`Booking status changed`, {
          description: `${booking.studentName}'s booking is now ${newStatus}`,
        });
      }
    }
  };

  const handleSaveChanges = () => {
    if (!tempSlot) return;
    setTimeSlots((prev) =>
      prev.map((slot) => (slot.time === tempSlot.time ? tempSlot : slot))
    );
    toast.success("Changes saved successfully", {
      description: `Time slot ${tempSlot.time} has been updated`,
    });
    setSelectedSlot(null);
    setTempSlot(null);
  };

  // 🔹 Add new booking manually
  const handleAddBookingManually = () => {
    if (!selectedUser || !tempSlot) {
      toast.error("Please select a user first");
      return;
    }

    const newBooking: Booking = {
      id: crypto.randomUUID(),
      studentName: selectedUser.name,
      studentEmail: selectedUser.email,
      studentPhone: selectedUser.phone,
      timeSlot: tempSlot.time,
      date: selectedDate,
      status: "pending",
      image: selectedUser.image,
    };

    setTempSlot({
      ...tempSlot,
      bookings: [...tempSlot.bookings, newBooking],
    });

    toast.success("Booking added", {
      description: `${selectedUser.name} added to ${tempSlot.time}`,
    });

    setSelectedUser(null);
    setSearchTerm("");
  };

  return (
    <TooltipProvider>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              Time Booking Management
            </h1>
            <p className="text-muted-foreground">
              Manage bookings and schedule availability
            </p>
          </div>
        </div>

        {/* Calendar + Time Slots */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
            <div className="flex-shrink-0 flex justify-center lg:justify-start w-full lg:w-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border w-fit"
                disabled={{ before: new Date() }}
              />
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-lg font-semibold text-center lg:text-left mb-4">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {timeSlots.map((slot) => (
                    <Tooltip key={slot.time}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-16 flex-col gap-1 transition-all duration-200",
                            getSlotStatusColor(slot.status)
                          )}
                          onClick={() => handleSlotClick(slot)}
                        >
                          <div className="flex flex-col items-center">
                            {getSlotStatusIcon(slot.status)}
                            <span className="text-xs font-medium">
                              {slot.time}
                            </span>
                          </div>
                          {slot.bookings.length > 0 && (
                            <div className="text-xs">
                              {slot.bookings.length} booking
                              {slot.bookings.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-medium">Time: {slot.time}</div>
                          <div>Status: {slot.status}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dialog */}
        <Dialog
          open={!!selectedSlot}
          onOpenChange={() => setSelectedSlot(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getSlotStatusIcon(tempSlot?.status || "free")} Time Slot:{" "}
                {tempSlot?.time}
              </DialogTitle>
            </DialogHeader>

            {tempSlot && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveChanges();
                }}
              >
                {/* Slot status */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Slot Status</h3>
                  <Select
                    value={tempSlot.status}
                    onValueChange={(value: any) =>
                      handleTempSlotStatusChange(value)
                    }
                  >
                    <SelectTrigger className="w-32 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Existing Bookings */}
                {/* Bookings */}
                <div className="space-y-2">
                  {tempSlot.bookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className="p-4 flex flex-col sm:flex-row gap-3 items-center hover:bg-accent transition-colors"
                    >
                      <Image
                        width={48}
                        height={48}
                        src={booking.image}
                        alt={booking.studentName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{booking.studentName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {booking.studentEmail}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={
                            booking.status === "accepted"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            handleTempBookingStatusChange(
                              booking.id,
                              "accepted"
                            )
                          }
                          className="text-sm"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            booking.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                          onClick={() =>
                            handleTempBookingStatusChange(
                              booking.id,
                              "cancelled"
                            )
                          }
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* 🔹 Add Booking Section */}
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-medium">Add New Booking</h3>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <Input
                      placeholder="Search user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={selectedUser?.id || ""}
                      onValueChange={(id) => {
                        const found = mockUsers.find((u) => u.id === id);
                        setSelectedUser(found || null);
                      }}
                    >
                      <SelectTrigger className="w-48 text-sm">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleAddBookingManually}
                      disabled={!selectedUser}
                    >
                      Add Booking
                    </Button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedSlot(null);
                      toast.info("Changes discarded", {
                        description: "No changes were saved",
                      });
                    }}
                  >
                    Discard Changes
                  </Button>
                  <Button type="submit" className="w-full">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
