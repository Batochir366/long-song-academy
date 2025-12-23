"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/axios";
import { isAxiosError } from "axios";
import Image from "next/image";

interface UserClassroom {
  _id?: string;
  className?: string;
}

interface UserApiResponse {
  _id?: string;
  clerkId?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  photo?: string;
  isPaid?: boolean;
  classroom?: UserClassroom | null;
  className?: string;
  classroomId?: string | null;
}

interface Payment {
  id: string;
  name: string;
  isPaid: boolean;
  className: string;
  classroomId: string | null;
  image: string;
  clerkId?: string;
}

interface ClassroomOption {
  id: string;
  name: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classroomsError, setClassroomsError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get("/api/users");
        const users: UserApiResponse[] = data?.users ?? [];
        const formatted: Payment[] = users.map((user) => {
          const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          const displayName =
            (fullName.length > 0 ? fullName : undefined) ??
            user.userName ??
            user.clerkId ??
            "Unnamed user";
          const classroomName =
            user.className ?? user.classroom?.className ?? "Unassigned";
          const rawClassroomId =
            user.classroomId ?? user.classroom?._id ?? null;
          const normalizedClassroomId =
            rawClassroomId ??
            (classroomName && classroomName !== "Unassigned"
              ? `fallback-${classroomName}`
              : null);
          return {
            id:
              user._id ??
              user.clerkId ??
              `temp-${Math.random().toString(36).slice(2)}`,
            name: displayName,
            clerkId: user.clerkId,
            isPaid: Boolean(user.isPaid),
            className: classroomName ?? "Unassigned",
            classroomId: normalizedClassroomId,
            image: user.photo ?? "/placeholder.svg",
          };
        });
        setPayments(formatted);
      } catch (err) {
        const message = isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to load users.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    const fetchClassrooms = async () => {
      setClassroomsLoading(true);
      setClassroomsError(null);
      try {
        const { data } = await apiClient.get("/api/classrooms");
        const fetched: ClassroomOption[] = (data?.classrooms ?? []).map(
          (cls: any) => ({
            id: cls.id ?? cls._id,
            name: cls.className ?? "Unnamed classroom",
          })
        );
        setClassrooms(fetched);
      } catch (err) {
        const message = isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to load classrooms.";
        setClassroomsError(message);
      } finally {
        setClassroomsLoading(false);
      }
    };

    fetchUsers();
    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (
      selectedPayment &&
      !payments.some((payment) => payment.id === selectedPayment.id)
    ) {
      setSelectedPayment(null);
    }
  }, [payments, selectedPayment]);

  const classOptions = useMemo(() => {
    const optionsMap = new Map<string, ClassroomOption>();
    classrooms.forEach((cls) => {
      if (cls.id) {
        optionsMap.set(cls.id, cls);
      }
    });

    if (
      selectedPayment?.classroomId &&
      !optionsMap.has(selectedPayment.classroomId)
    ) {
      optionsMap.set(selectedPayment.classroomId, {
        id: selectedPayment.classroomId,
        name: selectedPayment.className,
      });
    }

    if (
      selectedPayment?.classroomId === null &&
      selectedPayment.className &&
      selectedPayment.className !== "Unassigned"
    ) {
      const fallbackId = `fallback-${selectedPayment.className}`;
      optionsMap.set(fallbackId, {
        id: fallbackId,
        name: selectedPayment.className,
      });
    }

    return Array.from(optionsMap.values());
  }, [classrooms, selectedPayment]);

  const filteredPayments = payments.filter((payment) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      payment.name.toLowerCase().includes(query) ||
      (payment.clerkId?.toLowerCase().includes(query) ?? false);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "paid" && payment.isPaid) ||
      (filterStatus === "unpaid" && !payment.isPaid);
    return matchesSearch && matchesStatus;
  });

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    setSaving(true);
    setUpdateError(null);

    const payload: Record<string, any> = {
      isPaid: selectedPayment.isPaid,
    };

    const selectedClassroomId = selectedPayment.classroomId;
    if (!selectedClassroomId || selectedClassroomId.startsWith("fallback-")) {
      payload.classroomId = null;
    } else {
      payload.classroomId = selectedClassroomId;
    }

    try {
      const { data } = await apiClient.patch(
        `/api/users/${selectedPayment.id}`,
        payload
      );
      const updatedUser: UserApiResponse | undefined = data?.user;

      if (updatedUser) {
        const fullName = [updatedUser.firstName, updatedUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const displayName =
          (fullName.length > 0 ? fullName : undefined) ??
          updatedUser.userName ??
          updatedUser.clerkId ??
          "Unnamed user";
        const classroomName =
          updatedUser.className ??
          updatedUser.classroom?.className ??
          "Unassigned";
        const classroomId =
          updatedUser.classroomId ?? updatedUser.classroom?._id ?? null;
        const normalizedClassroomId =
          classroomId ??
          (classroomName && classroomName !== "Unassigned"
            ? `fallback-${classroomName}`
            : null);

        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === selectedPayment.id
              ? {
                  ...payment,
                  name: displayName,
                  isPaid: Boolean(updatedUser.isPaid),
                  className: classroomName ?? "Unassigned",
                  classroomId: normalizedClassroomId,
                }
              : payment
          )
        );
      } else {
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === selectedPayment.id
              ? {
                  ...payment,
                  isPaid: selectedPayment.isPaid,
                  className: selectedPayment.className,
                  classroomId:
                    payload.classroomId === null ? null : payload.classroomId,
                }
              : payment
          )
        );
      }

      toast.success("Payment updated successfully", {
        description: `${selectedPayment.name} is now marked as ${
          selectedPayment.isPaid ? "paid" : "unpaid"
        }`,
      });

      setSelectedPayment(null);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to update payment.";
      setUpdateError(message);
      toast.error("Failed to update payment", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (isPaid: boolean) => (
    <Badge
      variant={isPaid ? "default" : "secondary"}
      className={`text-xs px-2 py-1 ${
        isPaid ? "bg-green-500/15 text-green-700" : "bg-red-500/15 text-red-700"
      }`}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </Badge>
  );

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto w-full min-w-[375px]">
      {/* Header */}
      <header className="text-center sm:text-left">
        <h1 className="text-xl sm:text-3xl font-semibold mb-1 sm:mb-2">
          Payments Management
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track and manage student payment status
        </p>
      </header>

      {/* Filters */}
      <Card className="p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>

          {/* Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block border rounded-lg">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50">
                    <TableCell className="flex items-center gap-2">
                      <Image
                        width={32}
                        height={32}
                        src={payment.image || "/placeholder.svg"}
                        alt={payment.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <span>{payment.name}</span>
                        {payment.clerkId && (
                          <span className="text-xs text-muted-foreground">
                            {payment.clerkId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.isPaid)}</TableCell>
                    <TableCell>{payment.className}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUpdateError(null);
                          setSaving(false);
                          setSelectedPayment({ ...payment });
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No payments found matching your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid sm:hidden gap-3">
          {loading ? (
            <Card className="p-4 text-center text-muted-foreground text-sm">
              Loading users...
            </Card>
          ) : error ? (
            <Card className="p-4 text-center text-destructive text-sm">
              {error}
            </Card>
          ) : filteredPayments.length === 0 ? (
            <Card className="p-4 text-center text-muted-foreground text-sm">
              No payments found matching your search
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id} className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      width={40}
                      height={40}
                      src={payment.image || "/placeholder.svg"}
                      alt={payment.name}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-sm">{payment.name}</p>
                      {payment.clerkId && (
                        <p className="text-[11px] text-muted-foreground">
                          {payment.clerkId}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(payment.isPaid)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payment.className}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUpdateError(null);
                    setSaving(false);
                    setSelectedPayment({ ...payment });
                  }}
                  className="w-full text-xs"
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Update
                </Button>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Dialog */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayment(null);
            setUpdateError(null);
            setSaving(false);
          }
        }}
      >
        <DialogContent className="w-[90%] sm:max-w-md rounded-xl px-4 py-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Update Payment
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleUpdatePayment();
              }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={selectedPayment.classroomId ?? "unassigned"}
                    onValueChange={(value) =>
                      setSelectedPayment((prev) => {
                        if (!prev) return prev;
                        if (value === "unassigned") {
                          return {
                            ...prev,
                            classroomId: null,
                            className: "Unassigned",
                          };
                        }
                        const matchingClass = classOptions.find(
                          (cls) => cls.id === value
                        );
                        return {
                          ...prev,
                          classroomId: value,
                          className: matchingClass?.name ?? prev.className,
                        };
                      })
                    }
                    disabled={
                      saving || (classroomsLoading && !classOptions.length)
                    }
                  >
                    <SelectTrigger id="class" className="text-sm">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {classOptions.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classroomsLoading && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Loading classrooms...
                    </p>
                  )}
                  {classroomsError && (
                    <p className="mt-1 text-xs text-destructive">
                      {classroomsError}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <Label htmlFor="status">Payment Status</Label>
                  <Select
                    value={selectedPayment.isPaid ? "paid" : "unpaid"}
                    onValueChange={(value) =>
                      setSelectedPayment((prev) =>
                        prev ? { ...prev, isPaid: value === "paid" } : prev
                      )
                    }
                    disabled={saving}
                  >
                    <SelectTrigger id="status" className="text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save button desktop */}
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                {updateError && (
                  <p className="mt-2 text-sm text-destructive">{updateError}</p>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
