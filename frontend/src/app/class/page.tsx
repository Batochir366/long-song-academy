"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle, Lock, Loader2, CheckCircle } from "lucide-react";
import apiClient from "@/lib/axios";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  isFree: boolean;
  keyPoints: string[];
}

export default function ClassPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [classroomName, setClassroomName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserClassroomSubjects = async () => {
      if (!userLoaded) return;

      // Check if user is authenticated
      if (!user) {
        setError("Та эхлээд нэвтэрнэ үү.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user from backend with classroom populated
        const userResponse = await apiClient.get("/api/users", {
          params: { clerkId: user.id },
        });

        if (!userResponse.data.users || userResponse.data.users.length === 0) {
          setError("Хэрэглэгч олдсонгүй.");
          setLoading(false);
          return;
        }

        const dbUser = userResponse.data.users[0];
        setIsPaidUser(dbUser.isPaid || false);

        // Check if user has a classroom
        if (!dbUser.classroom || !dbUser.classroom._id) {
          setError("Та ангид бүртгэгдээгүй байна.");
          setLoading(false);
          return;
        }

        // Extract subjects from classroom
        const classroom = dbUser.classroom;
        setClassroomName(classroom.className || null);

        if (!classroom.subjects || classroom.subjects.length === 0) {
          setError("Энэ ангид одоогоор хичээл байхгүй байна.");
          setLoading(false);
          return;
        }

        // Format subjects to match Lesson interface
        const formattedLessons: Lesson[] = classroom.subjects.map(
          (subject: any) => ({
            id: subject._id?.toString() || subject.id?.toString() || "",
            title: subject.subjectName || "",
            duration: subject.duration || "",
            description: subject.description || "",
            videoUrl: subject.videoUrl || "",
            thumbnail: subject.thumbnailUrl || "/placeholder.svg",
            isFree: subject.isFree || false,
            keyPoints: subject.keyPoints || [],
          })
        );

        setLessons(formattedLessons);
      } catch (err: any) {
        console.error("Error fetching user classroom subjects:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Хичээл ачаалахад алдаа гарлаа. Дахин оролдоно уу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserClassroomSubjects();
  }, [user, userLoaded]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Хичээлүүд ачаалж байна...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => (window.location.href = "/sign-in")}>
            Нэвтрэх хуудас руу шилжих
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Class Header */}
          <div className="mb-12">
            {classroomName && <Badge className="mb-4">{classroomName}</Badge>}
            <h1 className="font-serif text-5xl md:text-6xl mb-6 text-foreground">
              Таны Хичээлүүд
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Монгол уртын дууны урлаг болон соёлыг суралцах таны эрхтэй
              хичээлүүд. Бүх хичээлээ үзэж, Сарангэрэлтэй хувийн хичээлүүд
              захиалаарай.
            </p>
          </div>

          {/* Course Curriculum */}
          <div className="mb-12">
            <h2 className="font-serif text-3xl md:text-4xl mb-8 text-foreground">
              Хичээлийн хөтөлбөр
            </h2>
            {lessons.length === 0 ? (
              <Card className="border-border bg-card text-center py-16">
                <CardContent>
                  <p className="text-muted-foreground">
                    Одоогоор хичээл байхгүй байна.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => {
                  const isLessonAccessible = lesson.isFree || isPaidUser;

                  return (
                    <Card
                      key={lesson.id}
                      className={`border-border bg-card hover:shadow-lg transition-all overflow-hidden group ${
                        isLessonAccessible
                          ? "cursor-pointer"
                          : "cursor-not-allowed"
                      }`}
                    >
                      <Link
                        href={
                          isLessonAccessible
                            ? `/class/lessons/${lesson.id}`
                            : "#"
                        }
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="relative md:w-64 aspect-video md:aspect-auto overflow-hidden">
                            <img
                              src={lesson.thumbnail || "/placeholder.svg"}
                              alt={lesson.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {!isLessonAccessible && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <Lock className="w-12 h-12 text-white" />
                              </div>
                            )}
                            {isLessonAccessible && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle className="w-16 h-16 text-white" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <Badge
                                variant="secondary"
                                className="bg-background/90"
                              >
                                Хичээл {index + 1}
                              </Badge>
                            </div>
                            {lesson.isFree && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-primary">Үнэгүй</Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="flex-1 pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-serif text-xl md:text-2xl text-card-foreground">
                                {lesson.title}
                              </h3>
                              {lesson.duration && (
                                <Badge
                                  variant="outline"
                                  className="ml-4 whitespace-nowrap"
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  {lesson.duration}
                                </Badge>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-muted-foreground leading-relaxed mb-3">
                                {lesson.description}
                              </p>
                            )}
                            {!isLessonAccessible && (
                              <div className="mt-4">
                                <Badge variant="secondary" className="bg-muted">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Төлбөртэй хичээл
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
