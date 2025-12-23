import { Request, Response } from "express";
import ClassRoomModel from "../model/classRoom.model";

const MAX_JOIN_CODE_ATTEMPTS = 20;

const generateJoinCode = async (): Promise<number> => {
  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
    const code = Math.floor(100000 + Math.random() * 900000);
    const exists = await ClassRoomModel.exists({ joinCode: code });
    if (!exists) {
      return code;
    }
  }
  throw new Error("Failed to generate unique join code");
};

export const getClassrooms = async (_req: Request, res: Response) => {
  try {
    const classrooms = await ClassRoomModel.find()
      .select("className joinCode students subjects endDate createdAt updatedAt")
      .lean();

    const formatted = classrooms.map((cls) => ({
      id: cls._id,
      className: cls.className,
      joinCode: cls.joinCode,
      endDate: cls.endDate,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      totalStudents: Array.isArray(cls.students) ? cls.students.length : 0,
      subjectCount: Array.isArray(cls.subjects) ? cls.subjects.length : 0,
    }));

    return res.status(200).json({ classrooms: formatted });
  } catch (error: any) {
    console.error("Error fetching classrooms:", error);
    return res.status(500).json({
      error: "Failed to fetch classrooms",
      details: error?.message,
    });
  }
};

export const getClassroomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classroom = await ClassRoomModel.findById(id)
      .populate({
        path: "students",
        select:
          "firstName lastName userName clerkId photo isPaid createdAt updatedAt",
      })
      .populate({
        path: "subjects",
        select: "subjectName description subjectVideoKey videoUrl thumbnailUrl duration isFree keyPoints createdAt updatedAt",
      })
      .lean();

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    return res.status(200).json({ classroom });
  } catch (error: any) {
    console.error("Error fetching classroom detail:", error);
    return res.status(500).json({
      error: "Failed to fetch classroom",
      details: error?.message,
    });
  }
};

export const createClassroom = async (req: Request, res: Response) => {
  try {
    const { className, endDate } = req.body;

    if (!className || typeof className !== "string") {
      return res.status(400).json({ error: "className is required" });
    }

    const joinCode = await generateJoinCode();

    const classroom = await ClassRoomModel.create({
      className: className.trim(),
      joinCode,
      endDate,
    });

    return res.status(201).json({ classroom });
  } catch (error: any) {
    console.error("Error creating classroom:", error);
    if (error?.message?.includes("join code")) {
      return res.status(500).json({
        error: "Failed to generate classroom join code",
        details: error?.message,
      });
    }
    return res.status(500).json({
      error: "Failed to create classroom",
      details: error?.message,
    });
  }
};

