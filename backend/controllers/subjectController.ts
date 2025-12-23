import { Request, Response } from "express";
import SubjectModel from "../model/subject.model";

export const getAllSubjects = async (_req: Request, res: Response) => {
  try {
    const subjects = await SubjectModel.find()
      .select(
        "subjectName description videoUrl thumbnailUrl duration isFree keyPoints createdAt updatedAt"
      )
      .lean();

    const formatted = subjects.map((subject, index) => ({
      id: subject._id.toString(),
      title: subject.subjectName,
      description: subject.description || "",
      duration: subject.duration || "",
      videoUrl: subject.videoUrl || "",
      thumbnail: subject.thumbnailUrl || "",
      isFree: subject.isFree || false,
      keyPoints: subject.keyPoints || [],
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    }));

    return res.status(200).json({ subjects: formatted });
  } catch (error: any) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({
      error: "Failed to fetch subjects",
      details: error?.message,
    });
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subject = await SubjectModel.findById(id).lean();

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const formatted = {
      id: subject._id.toString(),
      title: subject.subjectName,
      description: subject.description || "",
      duration: subject.duration || "",
      videoUrl: subject.videoUrl || "",
      thumbnail: subject.thumbnailUrl || "",
      isFree: subject.isFree || false,
      keyPoints: subject.keyPoints || [],
      subjectVideoKey: subject.subjectVideoKey || "",
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };

    return res.status(200).json({ subject: formatted });
  } catch (error: any) {
    console.error("Error fetching subject:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid subject ID" });
    }
    return res.status(500).json({
      error: "Failed to fetch subject",
      details: error?.message,
    });
  }
};

