"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import apiClient from "@/lib/axios";
import { isAxiosError } from "axios";
import { FolderDropdown } from "@/components/FolderDropdown";
import { uploadImage } from "@/lib/cloudinary";

interface ClassroomStudent {
  _id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  clerkId?: string;
  photo?: string;
  isPaid?: boolean;
  createdAt?: string;
}

interface ClassroomSubject {
  _id: string;
  subjectName: string;
  description?: string;
  subjectVideoKey: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  isFree?: boolean;
  keyPoints?: string[];
  createdAt?: string;
}

interface ClassroomDetail {
  _id: string;
  className: string;
  joinCode: number;
  endDate?: string;
  students?: ClassroomStudent[];
  subjects?: ClassroomSubject[];
  createdAt?: string;
  updatedAt?: string;
}

interface SubjectFormState {
  subjectName: string;
  description: string;
  file: File | null;
  folderId: string;
  thumbnail: File | null;
  duration: string;
  isFree: boolean;
  keyPoints: string[];
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ============================================
// SECURE VIDEO URL VALIDATION
// ============================================

const isValidVideoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.protocol === "https:" &&
      urlObj.hostname === "drive.google.com" &&
      urlObj.pathname.startsWith("/file/d/") &&
      urlObj.pathname.endsWith("/preview")
    );
  } catch {
    return false;
  }
};

const getSecureVideoUrl = (subject: ClassroomSubject): string | null => {
  // Prefer videoUrl if it exists and is valid
  if (subject.videoUrl && isValidVideoUrl(subject.videoUrl)) {
    return subject.videoUrl;
  }

  // Fallback: Generate from file ID for backward compatibility
  if (subject.subjectVideoKey) {
    // Validate file ID format
    const fileIdPattern = /^[a-zA-Z0-9_-]{20,}$/;
    if (fileIdPattern.test(subject.subjectVideoKey)) {
      return `https://drive.google.com/file/d/${subject.subjectVideoKey}/preview`;
    }
  }

  return null;
};

export default function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: classroomId } = use(params);

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [subjectForm, setSubjectForm] = useState<SubjectFormState>({
    subjectName: "",
    description: "",
    file: null,
    folderId: "",
    thumbnail: null,
    duration: "",
    isFree: false,
    keyPoints: [],
  });
  const [subjectUploading, setSubjectUploading] = useState(false);
  const [subjectProgress, setSubjectProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const fetchClassroom = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.get(`/api/classrooms/${classroomId}`);
      const detail: ClassroomDetail | null = data?.classroom ?? null;
      if (!detail) {
        setClassroom(null);
      } else {
        setClassroom({
          ...detail,
          students: detail.students ?? [],
          subjects: detail.subjects ?? [],
        });
      }
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to load classroom.";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroom();
  }, [classroomId]);

  const resetSubjectForm = () => {
    setSubjectForm({
      subjectName: "",
      description: "",
      file: null,
      folderId: "",
      thumbnail: null,
      duration: "",
      isFree: false,
      keyPoints: [],
    });
    setSubjectProgress(0);

    // Clear video preview
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }

    // Clear thumbnail preview
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
    }
  };

  const handleSubjectFormChange = (
    field: keyof SubjectFormState,
    value: string | File | null
  ) => {
    setSubjectForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "file") {
      setSubjectProgress(0);

      // Create video preview URL
      if (value instanceof File && value.type.startsWith("video/")) {
        // Revoke previous URL if exists
        if (videoPreviewUrl) {
          URL.revokeObjectURL(videoPreviewUrl);
        }
        const previewUrl = URL.createObjectURL(value);
        setVideoPreviewUrl(previewUrl);
      } else {
        // Clear preview if no file
        if (videoPreviewUrl) {
          URL.revokeObjectURL(videoPreviewUrl);
        }
        setVideoPreviewUrl(null);
      }
    }

    if (field === "thumbnail") {
      // Create thumbnail preview URL
      if (value instanceof File && value.type.startsWith("image/")) {
        // Revoke previous URL if exists
        if (thumbnailPreviewUrl) {
          URL.revokeObjectURL(thumbnailPreviewUrl);
        }
        const previewUrl = URL.createObjectURL(value);
        setThumbnailPreviewUrl(previewUrl);
      } else {
        // Clear preview if no file
        if (thumbnailPreviewUrl) {
          URL.revokeObjectURL(thumbnailPreviewUrl);
        }
        setThumbnailPreviewUrl(null);
      }
    }
  };

  const handleSubjectUpload = async () => {
    if (!classroom) {
      toast.error("Classroom not loaded", {
        description: "Please wait for the classroom to finish loading.",
      });
      return;
    }

    if (!subjectForm.file) {
      toast.error("No file selected", {
        description: "Please choose a video file before uploading.",
      });
      return;
    }

    if (!subjectForm.subjectName.trim()) {
      toast.error("Subject name required", {
        description: "Add a subject name to help students identify the lesson.",
      });
      return;
    }

    setSubjectUploading(true);
    setSubjectProgress(0);

    try {
      let uploadedThumbnailUrl = "";

      // Step 1: Upload thumbnail to Cloudinary if provided
      if (subjectForm.thumbnail) {
        setThumbnailUploading(true);
        toast.info("Uploading thumbnail...", {
          description: "Please wait while we upload the thumbnail image.",
        });

        const thumbnailResult = await uploadImage(subjectForm.thumbnail);

        if (thumbnailResult && typeof thumbnailResult === "string") {
          uploadedThumbnailUrl = thumbnailResult;
          toast.success("Thumbnail uploaded", {
            description: "Thumbnail uploaded successfully.",
          });
        } else {
          toast.error("Thumbnail upload failed", {
            description: "Continuing with video upload without thumbnail.",
          });
        }

        setThumbnailUploading(false);
      }

      // Step 2: Upload video to Google Drive with thumbnail URL
      const classSlug = toSlug(classroom.className) || "classroom";
      const folderSlug = `classrooms/${classSlug}`;
      const subjectSlug = toSlug(subjectForm.subjectName) || "subject";
      const fileExtension = subjectForm.file.name.includes(".")
        ? subjectForm.file.name.substring(
            subjectForm.file.name.lastIndexOf(".")
          )
        : "";

      const formData = new FormData();
      formData.append("file", subjectForm.file);
      formData.append("folder", folderSlug);
      formData.append("classroomId", classroom._id);
      formData.append("subjectName", subjectForm.subjectName.trim());
      formData.append("classroomName", classroom.className);
      formData.append("subjectSlug", subjectSlug + fileExtension);

      if (subjectForm.description.trim()) {
        formData.append("description", subjectForm.description.trim());
      }
      if (subjectForm.folderId) {
        formData.append("folderId", subjectForm.folderId);
      }
      // Add uploaded thumbnail URL if available
      if (uploadedThumbnailUrl) {
        formData.append("thumbnailUrl", uploadedThumbnailUrl);
      }

      toast.info("Uploading video...", {
        description: "This may take a few minutes depending on file size.",
      });

      const { data } = await apiClient.post("/api/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          setSubjectProgress(progress);
        },
      });

      toast.success("Subject uploaded", {
        description: data?.subject
          ? `Created subject "${data.subject.subjectName}"`
          : "Video uploaded successfully.",
      });

      resetSubjectForm();
      setIsUploadModalOpen(false);
      await fetchClassroom();
    } catch (error) {
      const description = isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "Unexpected error occurred during upload.";
      toast.error("Upload failed", {
        description,
      });
    } finally {
      setSubjectUploading(false);
      setThumbnailUploading(false);
      setSubjectProgress(0);
    }
  };

  const getStudentDisplayName = (student: ClassroomStudent) => {
    const fullName = [student.firstName, student.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fullName) return fullName;
    if (student.userName) return student.userName;
    if (student.clerkId) return student.clerkId;
    return "Unnamed student";
  };

  const sortedSubjects = useMemo(
    () =>
      classroom?.subjects
        ? [...classroom.subjects].sort((a, b) => {
            const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return right - left;
          })
        : [],
    [classroom?.subjects]
  );

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/classroom" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to classrooms
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={fetchClassroom}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {loading ? (
              <Card className="p-10 text-center text-muted-foreground">
                Loading classroom information...
              </Card>
            ) : (
              classroom && (
                <div className="flex flex-col gap-6">
                  <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="text-3xl font-semibold">
                          {classroom.className}
                        </h1>
                        <p className="text-muted-foreground">
                          Classroom overview and subject uploads.
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-base px-4 py-2"
                      >
                        Join Code: {classroom.joinCode}
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Total students
                        </p>
                        <p className="text-lg font-semibold">
                          {classroom.students?.length ?? 0}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Subjects
                        </p>
                        <p className="text-lg font-semibold">
                          {classroom.subjects?.length ?? 0}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Created on
                        </p>
                        <p className="text-lg font-semibold">
                          {classroom.createdAt
                            ? new Date(classroom.createdAt).toLocaleString()
                            : "—"}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">
                          End date
                        </p>
                        <p className="text-lg font-semibold">
                          {classroom.endDate
                            ? new Date(classroom.endDate).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </Card>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Students</h2>
                      <span className="text-sm text-muted-foreground">
                        {classroom.students?.length ?? 0} enrolled
                      </span>
                    </div>
                    {classroom.students && classroom.students.length > 0 ? (
                      <div className="space-y-3">
                        {classroom.students.map((student) => (
                          <Card key={student._id} className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={student.photo}
                                  alt={getStudentDisplayName(student)}
                                />
                                <AvatarFallback>
                                  {getStudentDisplayName(student)
                                    .split(" ")
                                    .map((part) => part.charAt(0))
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {getStudentDisplayName(student)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.clerkId ?? "No clerk ID"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  student.isPaid ? "default" : "secondary"
                                }
                              >
                                {student.isPaid ? "Paid" : "Unpaid"}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-4 text-sm text-muted-foreground">
                        No students enrolled yet.
                      </Card>
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Subjects</h2>
                      <span className="text-sm text-muted-foreground">
                        {classroom.subjects?.length ?? 0} total
                      </span>
                    </div>
                    {sortedSubjects.length > 0 ? (
                      <div className="space-y-3">
                        {sortedSubjects.map((subject) => {
                          const videoUrl = getSecureVideoUrl(subject);

                          return (
                            <Card key={subject._id} className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-base font-semibold">
                                  {subject.subjectName}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {subject.createdAt
                                    ? new Date(
                                        subject.createdAt
                                      ).toLocaleString()
                                    : ""}
                                </span>
                              </div>

                              {subject.description && (
                                <p className="text-sm text-muted-foreground">
                                  {subject.description}
                                </p>
                              )}

                              {/* Secure Video Preview */}
                              {videoUrl ? (
                                <div className="space-y-2">
                                  <iframe
                                    src={videoUrl}
                                    width="100%"
                                    height="300"
                                    allow="autoplay"
                                    sandbox="allow-scripts allow-same-origin"
                                    className="rounded-md border"
                                    title={subject.subjectName}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Video ID: {subject.subjectVideoKey}
                                  </p>
                                </div>
                              ) : (
                                <div className="p-4 bg-muted rounded-md">
                                  <p className="text-sm text-muted-foreground">
                                    ⚠️ Invalid or missing video URL
                                  </p>
                                  <p className="text-xs font-mono break-all mt-1">
                                    ID: {subject.subjectVideoKey}
                                  </p>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="p-4 text-sm text-muted-foreground">
                        No subjects uploaded yet.
                      </Card>
                    )}
                  </section>

                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Upload new subject
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Upload a lesson video to create a new subject entry for
                        this classroom.
                      </p>
                    </div>

                    <Dialog
                      open={isUploadModalOpen}
                      onOpenChange={setIsUploadModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Video className="h-4 w-4" />
                          Upload New Subject
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Upload New Subject</DialogTitle>
                          <DialogDescription>
                            Add a new lesson video with thumbnail and details
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          {/* Subject Name */}
                          <div className="space-y-2">
                            <Label htmlFor="modal-subjectName">
                              Subject name *
                            </Label>
                            <Input
                              id="modal-subjectName"
                              placeholder="e.g., Week 5: Music Theory"
                              value={subjectForm.subjectName}
                              onChange={(event) =>
                                handleSubjectFormChange(
                                  "subjectName",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label htmlFor="modal-subjectDescription">
                              Description
                            </Label>
                            <Input
                              id="modal-subjectDescription"
                              placeholder="Optional description"
                              value={subjectForm.description}
                              onChange={(event) =>
                                handleSubjectFormChange(
                                  "description",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          {/* Google Drive Folder */}
                          <div className="space-y-2">
                            <Label htmlFor="modal-googleDriveFolder">
                              Google Drive Folder
                            </Label>
                            <FolderDropdown
                              value={subjectForm.folderId}
                              onChange={(folderId) =>
                                handleSubjectFormChange("folderId", folderId)
                              }
                              placeholder="Select a folder or leave empty for default"
                            />
                          </div>

                          {/* Thumbnail Upload with Local Preview */}
                          <div className="space-y-2">
                            <Label htmlFor="modal-thumbnailFile">
                              Thumbnail Image
                              <span className="text-muted-foreground text-xs ml-2">
                                (will upload when you submit)
                              </span>
                            </Label>
                            <Input
                              id="modal-thumbnailFile"
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                handleSubjectFormChange(
                                  "thumbnail",
                                  file || null
                                );
                              }}
                              disabled={subjectUploading}
                            />

                            {thumbnailPreviewUrl && (
                              <Card className="p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={thumbnailPreviewUrl}
                                    alt="Thumbnail preview"
                                    className="w-40 h-24 object-cover rounded border"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      Thumbnail selected
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {subjectForm.thumbnail?.name} (
                                      {(
                                        subjectForm.thumbnail!.size / 1024
                                      ).toFixed(1)}{" "}
                                      KB)
                                    </p>
                                    {thumbnailUploading && (
                                      <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Uploading to Cloudinary...
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleSubjectFormChange(
                                        "thumbnail",
                                        null
                                      );
                                      const input = document.getElementById(
                                        "modal-thumbnailFile"
                                      ) as HTMLInputElement;
                                      if (input) input.value = "";
                                    }}
                                    disabled={subjectUploading}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </Card>
                            )}
                          </div>

                          {/* Video File Upload */}
                          <div className="space-y-2">
                            <Label htmlFor="modal-subjectFile">
                              Lesson video *
                            </Label>
                            <Input
                              id="modal-subjectFile"
                              type="file"
                              accept="video/*"
                              onChange={(event) =>
                                handleSubjectFormChange(
                                  "file",
                                  event.target.files?.[0] ?? null
                                )
                              }
                              disabled={subjectUploading}
                            />
                            {subjectForm.file && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Selected: {subjectForm.file.name} (
                                  {(
                                    subjectForm.file.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB)
                                </p>

                                {/* Video Preview */}
                                {videoPreviewUrl && (
                                  <Card className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium">
                                        Video Preview
                                      </p>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          handleSubjectFormChange("file", null);
                                          const fileInput =
                                            document.getElementById(
                                              "modal-subjectFile"
                                            ) as HTMLInputElement;
                                          if (fileInput) fileInput.value = "";
                                        }}
                                        disabled={subjectUploading}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                    <video
                                      src={videoPreviewUrl}
                                      controls
                                      className="w-full rounded-md border"
                                      style={{ maxHeight: "300px" }}
                                    >
                                      Your browser does not support video
                                      preview.
                                    </video>
                                  </Card>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Upload Progress */}
                          {subjectUploading && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>
                                  {thumbnailUploading
                                    ? "Uploading thumbnail..."
                                    : "Uploading video..."}
                                </span>
                                <span>{subjectProgress}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${subjectProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <Video className="h-4 w-4" />
                            <span>Video files up to 500MB are supported.</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              resetSubjectForm();
                              setIsUploadModalOpen(false);
                            }}
                            disabled={subjectUploading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSubjectUpload}
                            disabled={
                              subjectUploading ||
                              !subjectForm.subjectName.trim() ||
                              !subjectForm.file
                            }
                            className="gap-2"
                          >
                            {subjectUploading && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {thumbnailUploading
                              ? "Uploading Thumbnail..."
                              : "Upload Subject"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </section>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
