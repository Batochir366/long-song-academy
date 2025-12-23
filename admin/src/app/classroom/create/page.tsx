'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/axios";
import Link from "next/link";

export default function ClassroomCreatePage() {
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!className.trim()) {
      toast.error("Class name required", {
        description: "Please provide a class name before creating a classroom.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/api/classrooms", {
        className: className.trim(),
        endDate: endDate || undefined,
      });

      const classroomId = data?.classroom?._id;

      toast.success("Classroom created", {
        description: `Join code: ${data?.classroom?.joinCode ?? "N/A"}`,
      });

      if (classroomId) {
        router.push(`/classroom/${classroomId}`);
      } else {
        router.push("/classroom");
      }
    } catch (error) {
      const description =
        (error as any)?.response?.data?.error ||
        (error as Error).message ||
        "Failed to create classroom.";
      toast.error("Creation failed", {
        description,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild>
                <Link href="/classroom" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to classrooms
                </Link>
              </Button>
            </div>
            <Card className="p-6 space-y-6 shadow-card">
              <div>
                <h1 className="text-2xl font-semibold">Create a new classroom</h1>
                <p className="text-sm text-muted-foreground">
                  Define a classroom and share the join code with students.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="className">Class name</Label>
                  <Input
                    id="className"
                    placeholder="e.g., Beginner Mongolian Music"
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create classroom
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
