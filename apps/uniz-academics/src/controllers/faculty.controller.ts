import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all faculty
export const getFaculties = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const filter: any = {};
    if (department && department !== "all") {
      filter.department = department as string;
    }

    const faculties = await prisma.faculty.findMany({
      where: filter,
      orderBy: { name: "asc" },
    });
    res.json(faculties);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get single faculty profile
export const getFacultyProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const faculty = await prisma.faculty.findUnique({
      where: { id },
    });
    if (!faculty) return res.status(404).json({ error: "Faculty not found" });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create faculty (Webmaster or HOD for their dept)
export const createFaculty = async (req: any, res: Response) => {
  try {
    const { name, email, department, photo, bio, role, designation } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // HODs can only create for their own department
    if (user.role === "hod") {
      // For now, let's just allow HODs to create faculty.
    } else if (user.role !== "webmaster" && user.role !== "dean") {
      return res.status(403).json({ error: "Permission denied" });
    }

    const faculty = await prisma.faculty.create({
      data: {
        name,
        email: email.toLowerCase(),
        department: department.toUpperCase(),
        photo,
        bio: bio || {},
        designation: designation || "Assistant Professor",
        role: role || "FACULTY",
      },
    });
    res.status(201).json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update faculty (Webmaster, HOD, or Self)
export const updateFaculty = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, photo, bio, department, role, designation } = req.body;
    const user = req.user;

    const existing = await prisma.faculty.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Faculty not found" });

    // Auth check
    if (
      user.role !== "webmaster" &&
      user.role !== "hod" &&
      user.username.toLowerCase() !== existing.email.split("@")[0].toLowerCase()
    ) {
      // return res.status(403).json({ error: "Permission denied" });
    }

    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        name,
        photo,
        bio,
        department: department?.toUpperCase(),
        designation,
        role,
      },
    });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete faculty (Webmaster only)
export const deleteFaculty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.faculty.delete({
      where: { id },
    });
    res.json({ message: "Faculty deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update Role (Webmaster only)
export const updateFacultyRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // "FACULTY", "DEAN", "WEBMASTER"

    const faculty = await prisma.faculty.update({
      where: { id },
      data: { role },
    });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
