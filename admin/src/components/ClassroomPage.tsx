import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Upload, Plus, RefreshCw } from "lucide-react";
import apiClient from "@/lib/axios";
import Link from "next/link";
import { toast } from "sonner";

interface ClassroomSummary {
  id: string;
  className: string;
  joinCode: number;
  totalStudents: number;
  subjectCount: number;
  createdAt?: string;
  updatedAt?: string;
  endDate?: string;
}

export default function ClassroomPage() {
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/classrooms");
      const fetched: ClassroomSummary[] = (data?.classrooms ?? []).map(
        (cls: any) => ({
          id: cls.id ?? cls._id,
          className: cls.className,
          joinCode: cls.joinCode,
          totalStudents: cls.totalStudents ?? 0,
          subjectCount: cls.subjectCount ?? 0,
          createdAt: cls.createdAt,
          updatedAt: cls.updatedAt,
          endDate: cls.endDate,
        })
      );
      setClassrooms(fetched);
    } catch (err) {
      toast.error("Failed to load classrooms", {
        description: "Failed to load classrooms.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const sortedClassrooms = useMemo(
    () =>
      [...classrooms].sort((a, b) => {
        const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return right - left;
      }),
    [classrooms]
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Classroom Management</h1>
          <p className="text-muted-foreground">
            Create classrooms, review students, and share new subjects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchClassrooms}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/classroom/create">
              <Plus className="h-4 w-4" />
              Create Classroom
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {loading && !classrooms.length ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-6 space-y-4">
              <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
            </Card>
          ))
        ) : sortedClassrooms.length === 0 ? (
          <Card className="p-6 text-muted-foreground">
            <p>
              No classrooms yet. Create your first classroom to get started.
            </p>
          </Card>
        ) : (
          sortedClassrooms.map((classroom) => (
            <Card key={classroom.id} className="shadow-card">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      {classroom.className}
                    </h3>
                    <Badge variant="secondary">
                      Join Code: {classroom.joinCode}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{classroom.totalStudents} students</span>
                    <span>•</span>
                    <span>{classroom.subjectCount} subjects</span>
                  </div>
                  {classroom.endDate && (
                    <p className="text-xs text-muted-foreground">
                      Ends on:{" "}
                      {new Date(classroom.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button className="w-full gap-2" variant="default" asChild>
                  <Link href={`/classroom/${classroom.id}`}>
                    <Upload className="h-4 w-4" />
                    Manage Classroom
                  </Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
