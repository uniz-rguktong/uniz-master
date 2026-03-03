import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all faculty
export const getFaculties = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const faculties = await prisma.faculty.findMany({
      where: department ? { department: department as string } : {},
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

// Create faculty (Webmaster only)
export const createFaculty = async (req: Request, res: Response) => {
  try {
    const { name, email, department, photo, bio, role } = req.body;
    const faculty = await prisma.faculty.create({
      data: {
        name,
        email,
        department,
        photo,
        bio,
        role: role || "FACULTY",
      },
    });
    res.status(201).json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update faculty (Webmaster or Self)
export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, photo, bio, department, role } = req.body;

    // In a real app, check if requester is webmaster or the faculty themselves
    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        name,
        photo,
        bio,
        department,
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
