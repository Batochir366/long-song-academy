"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Folder {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
}

interface FolderDropdownProps {
  value?: string;
  onChange: (folderId: string) => void;
  placeholder?: string;
  className?: string;
}

export function FolderDropdown({
  value,
  onChange,
  placeholder = "Select folder",
  className = "",
}: FolderDropdownProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load folders from API
  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/videos/folders");
      const data = await response.json();

      if (response.ok) {
        setFolders(data.folders);
      } else {
        toast.error(`Failed to load folders: ${data.error}`);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
      toast.error("Network error loading folders");
    } finally {
      setLoading(false);
    }
  };

  // Create new folder
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("http://localhost:8080/api/videos/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Folder "${data.folder.name}" created successfully!`);
        setNewFolderName("");
        setOpen(false);
        loadFolders(); // Refresh list
        onChange(data.folder.id); // Auto-select new folder
      } else {
        toast.error(`Failed to create folder: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Network error creating folder");
    } finally {
      setCreating(false);
    }
  };

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select value={value} onValueChange={onChange} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? "Loading..." : placeholder}>
                {value && folders.find((f) => f.id === value) ? (
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>{folders.find((f) => f.id === value)?.name}</span>
                  </div>
                ) : (
                  placeholder
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {folders.length === 0 && !loading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No folders found
                </div>
              ) : (
                folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={loadFolders}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>

        {/* Create Folder Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder in Google Drive for organizing your videos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Class 11 Physics"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creating) {
                      createFolder();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createFolder}
                disabled={creating || !newFolderName.trim()}
              >
                {creating ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected folder info */}
      {value && folders.find((f) => f.id === value) && (
        <p className="text-xs text-muted-foreground">
          Selected: {folders.find((f) => f.id === value)?.name}
        </p>
      )}
    </div>
  );
}
