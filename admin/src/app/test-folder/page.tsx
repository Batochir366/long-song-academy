"use client";

import { useState } from "react";
import { FolderDropdown } from "@/components/FolderDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function TestFolderPage() {
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!selectedFolderId) {
      toast.error("Please select a folder");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", selectedFolderId);

      if (subjectName) formData.append("subjectName", subjectName);
      if (description) formData.append("description", description);

      const response = await fetch("http://localhost:8080/api/videos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Upload амжилттай! 🎉");
        console.log("Upload result:", data);

        // Clear form
        setFile(null);
        setSubjectName("");
        setDescription("");

        const fileInput = document.getElementById(
          "fileInput"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(`Upload амжилтгүй: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">📁 Folder Upload Test Page</h1>
      <p className="text-muted-foreground mb-8">
        Test the new folder selection and upload functionality
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Folder Selection */}
              <div className="space-y-2">
                <Label htmlFor="folder">
                  Select Folder <span className="text-red-500">*</span>
                </Label>
                <FolderDropdown
                  value={selectedFolderId}
                  onChange={setSelectedFolderId}
                  placeholder="Choose a folder..."
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="fileInput">
                  Video/Image File <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fileInput"
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Subject Name */}
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name</Label>
                <Input
                  id="subjectName"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g., Physics Lesson 1"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                  disabled={uploading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!file || !selectedFolderId || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Google Drive
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Selected Folder</h3>
              {selectedFolderId ? (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-mono break-all">
                    {selectedFolderId}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No folder selected
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Load folders from Google Drive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Create new folders on the fly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Refresh folder list anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Upload to selected folder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✅</span>
                  <span>Real-time toast notifications</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    console.log("Selected Folder ID:", selectedFolderId);
                    toast.info(`Folder ID: ${selectedFolderId || "None"}`);
                  }}
                >
                  Log Folder ID to Console
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    window.open(
                      "http://localhost:8080/api/videos/folders",
                      "_blank"
                    );
                  }}
                >
                  View API Response
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔌 API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Backend URL</p>
              <p className="text-muted-foreground font-mono">
                http://localhost:8080
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Folders Endpoint</p>
              <p className="text-muted-foreground font-mono">
                GET /api/videos/folders
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Upload Endpoint</p>
              <p className="text-muted-foreground font-mono">
                POST /api/videos/upload
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
