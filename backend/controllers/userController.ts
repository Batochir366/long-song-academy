import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../model/user.model";
import ClassRoomModel from "../model/classRoom.model";

const toStringId = (value: any) => {
  if (!value) return value;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) {
    return value.toString();
  }
  return value;
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.query;

    const query: Record<string, any> = {};
    if (clerkId) {
      query.clerkId = clerkId;
    }

    const users = await UserModel.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "classroom",
        select: "className subjects",
        populate: {
          path: "subjects",
          select: "subjectName description subjectVideoKey videoUrl thumbnailUrl duration isFree keyPoints createdAt updatedAt",
        },
      })
      .lean();

    const formattedUsers = users.map((user) => {
      const classroom =
        user.classroom && typeof user.classroom === "object"
          ? {
              _id: toStringId((user.classroom as any)._id),
              className: (user.classroom as any).className ?? null,
              subjects: Array.isArray((user.classroom as any).subjects)
                ? (user.classroom as any).subjects.map((subject: any) => ({
                    _id: toStringId(subject._id),
                    id: toStringId(subject._id),
                    subjectName: subject.subjectName ?? null,
                    description: subject.description ?? null,
                    duration: subject.duration ?? null,
                    videoUrl: subject.videoUrl ?? null,
                    thumbnailUrl: subject.thumbnailUrl ?? null,
                    isFree: subject.isFree ?? false,
                    keyPoints: Array.isArray(subject.keyPoints) ? subject.keyPoints : [],
                    subjectVideoKey: subject.subjectVideoKey ?? null,
                  }))
                : [],
            }
          : null;

      return {
        ...user,
        _id: toStringId(user._id),
        classroom,
        className: classroom?.className ?? null,
        classroomId: classroom?._id ?? null,
      };
    });

    return res.status(200).json({ users: formattedUsers });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      error: "Failed to fetch users",
      details: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPaid, classroomId } = req.body;

    const identifierQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { clerkId: id };

    const user = await UserModel.findOne(identifierQuery);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (typeof isPaid === "boolean") {
      user.isPaid = isPaid;
    }

    if (classroomId !== undefined) {
      let nextClassroomId: mongoose.Types.ObjectId | null = null;

      if (
        classroomId !== null &&
        classroomId !== "" &&
        typeof classroomId === "string"
      ) {
        if (!mongoose.Types.ObjectId.isValid(classroomId)) {
          return res.status(400).json({ error: "Invalid classroomId" });
        }
        const classroom = await ClassRoomModel.findById(classroomId).select(
          "_id"
        );
        if (!classroom) {
          return res.status(404).json({ error: "Classroom not found" });
        }
        nextClassroomId = classroom._id;
      }

      if (user.classroom) {
        const sameClass =
          nextClassroomId &&
          user.classroom instanceof mongoose.Types.ObjectId &&
          user.classroom.equals(nextClassroomId);

        if (!sameClass) {
          await ClassRoomModel.updateOne(
            { _id: user.classroom },
            { $pull: { students: user._id } }
          );
        }
      }

      if (nextClassroomId) {
        await ClassRoomModel.updateOne(
          { _id: nextClassroomId },
          { $addToSet: { students: user._id } }
        );
        user.classroom = nextClassroomId;
      } else {
        user.classroom = null;
      }
    }

    await user.save();
    await user.populate({ path: "classroom", select: "className" });

    const classroom =
      user.classroom && typeof user.classroom === "object"
        ? {
            _id: toStringId((user.classroom as any)._id),
            className: (user.classroom as any).className ?? null,
          }
        : null;

    const responseUser = {
      ...user.toObject(),
      _id: toStringId(user._id),
      classroom,
      className: classroom?.className ?? null,
      classroomId: classroom?._id ?? null,
    };

    return res.status(200).json({ user: responseUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      error: "Failed to update user",
      details: error.message,
    });
  }
};
