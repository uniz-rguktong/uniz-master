import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subjectsData: any = {
  E1: {
    "Sem - 1": {
      CSE: {
        names: [
          "Calculus & Linear Algebra",
          "Basic Electrical and Electronics Engg.",
          "Problem Solving and Programming Through C",
          "Engineering Graphics & Computer Drafting",
          "English-Language communication Skills Lab-I",
          "Basic Electrical and Electronics Engg. Lab",
          "Problem Solving and Programming Through C Lab",
        ],
        credits: [4, 4, 4, 2.5, 2.5, 1.5, 1.5],
      },
      ECE: {
        names: [
          "Differential Equations and Multivariable Calculus",
          "Engineering Physics",
          "Engineering Physics Lab",
          "Engineering Graphics and Design",
          "Electrical Technology",
          "Electrical Technology Lab",
          "Introduction to Latest Technical Advancements",
          "Programming & Data Structures",
          "Programming & Data Structures Lab",
          "Biology for Engineers",
        ],
        credits: [4, 4, 1.5, 2.5, 4, 1.5, 1, 3, 1.5, 0],
      },
      EEE: {
        names: [
          "Differential Equations and Multivariable calculus",
          "Engineering Physics",
          "Engineering Physics Lab",
          "Engineering Graphics & Computer Drafting",
          "Electrical Technology",
          "Electrical Technology Lab",
          "Introduction to Latest Technical Advancements",
          "Programming & Data Structures",
          "Programming & Data Structures Lab",
        ],
        credits: [4, 4, 1.5, 2.5, 4, 1.5, 1, 3, 1.5, 0],
      },
      CIVIL: {
        names: [
          "Engineering Chemistry",
          "Differential Equations and Multivariable Calculus",
          "Basic Programming Language",
          "Engineering Graphics and Computer Drafting",
          "Computer Aided Drafting (CAD) Lab",
          "English Language Communication Skills Lab-I",
          "C Programming Lab",
          "Human Values",
        ],
        credits: [3, 4, 4, 2.5, 1.5, 2.5, 1.5, 0],
      },
      MECH: {
        names: [
          "Differential Equations and Multivariable Calculus",
          "English Language Communication Skills Lab - 1",
          "Engineering Physics",
          "Basic Electrical and Electronics Engineering",
          "Engineering Chemistry",
          "Workshop Practice",
          "Basic Electrical & Electronics Engineering Lab",
          "Engineering Physics & Chemistry Lab",
        ],
        credits: [4, 2.5, 4, 4, 3, 1.5, 1.5, 1.5],
      },
    },
    "Sem - 2": {
      CSE: {
        names: [
          "Discrete Mathematics",
          "Engineering Physics",
          "Managerial Economics and Finance Analysis",
          "Object Oriented Programming through Java",
          "Data Structures",
          "Engineering Physics Lab",
          "Object Oriented Programming through Java Lab",
          "Data Structures Lab",
        ],
        credits: [4, 4, 3, 4, 3, 1.5, 1.5, 1.5],
      },
      ECE: {
        names: [
          "Mathematical Methods",
          "Object Oriented Programming",
          "Object Oriented Programming Laboratory",
          "Computational Lab",
          "English-Language Communication Skills Lab-1",
          "Electronic Devices and Circuits",
          "Electronic Devices and Circuits Lab",
          "Network Theory",
          "Signals and Systems",
        ],
        credits: [4, 2, 1.5, 1.5, 2.5, 4, 1.5, 4, 4],
      },
      EEE: {
        names: [
          "Linear Algebra & Numerical Methods",
          "Digital Logic Design",
          "Digital Logic Design Lab",
          "Computational Lab",
          "English Language communication skills lab 1",
          "Electronic Devices and Circuits",
          "Electronic Devices and Circuits Lab",
          "Network Theory",
          "Introduction to AI",
        ],
        credits: [4, 4, 1.5, 1.5, 2.5, 4, 1.5, 4, 1],
      },
      CIVIL: {
        names: [
          "Advanced Programming Course",
          "Linear Algebra and Numerical Methods",
          "Basic Electrical and Electronics Engineering",
          "Engineering Mechanics",
          "Engineering Geology",
          "Advanced Programming Lab",
          "Workshop",
          "Environmental Science",
        ],
        credits: [3, 4, 3, 4, 3, 1.5, 1.5, 0],
      },
      MECH: {
        names: [
          "Mathematical Methods",
          "Engineering Mechanics",
          "Material Science & Metallurgy",
          "Programming and Data Structures",
          "Engineering Graphics and Computer Drafting",
          "Programming and Data Structures Lab",
          "Material Science and Metallurgy Lab",
        ],
        credits: [4, 4, 3, 3, 2.5, 1.5, 1.5],
      },
    },
  },
  E2: {
    "Sem - 1": {
      CSE: {
        names: [
          "Probability and Statistics",
          "Digital Logic Design",
          "Design & Analysis of Algorithms",
          "Database Management Systems",
          "Formal Languages & Automata Theory",
          "Design & Analysis of Algorithms Lab",
          "Digital Logic Design Lab",
          "Database Management Systems Lab",
        ],
        credits: [4, 3, 4, 3, 3, 1.5, 1.5, 1.5],
      },
      ECE: {
        names: [
          "Probability & Random Variables",
          "Internet of Things Lab",
          "Analog Electronic Circuits",
          "Analog Electronic Circuits Lab",
          "Digital Logic Design",
          "Digital Logic Design Lab",
          "Digital Signal Processing",
          "Digital Signal Processing Lab",
          "Control Systems",
        ],
        credits: [3, 1.5, 4, 1.5, 4, 1.5, 4, 1.5, 3],
      },
      EEE: {
        names: [
          "Probability & Random Variables",
          "Internet of Things Lab",
          "Analog Electronic Circuits",
          "Analog Electronic Circuits Lab",
          "Object Oriented Programming",
          "Object Oriented Programming Lab",
          "Signals & Systems",
          "Electrical Machines",
          "Electrical Machines Lab",
        ],
        credits: [3, 1, 4, 1.5, 3, 1, 4, 4, 1.5],
      },
      CIVIL: {
        names: [
          "Management Economics and Financial Analysis",
          "Building Materials and Construction",
          "Concrete Technology",
          "Mechanics of Fluids",
          "Mechanics of Materials",
          "Surveying",
          "Mechanics of Materials Lab",
          "Surveying Lab",
          "Indian Constitution",
        ],
        credits: [3, 3, 3, 3, 4, 4, 1.5, 1.5, 0],
      },
      MECH: {
        names: [
          "Transform Calculus",
          "Kinematics of Machinery",
          "Thermodynamics",
          "Mechanics of Solids",
          "Manufacturing Processes",
          "Mechanics of Solids Lab",
          "Computer Aided Machine Drawing",
        ],
        credits: [4, 4, 4, 4, 3, 1.5, 1.5],
      },
    },
    "Sem - 2": {
      CSE: {
        names: [
          "Introduction to Operation Research",
          "Computer Organization & Architecture",
          "Data Science with Python",
          "Web Technologies",
          "Compiler Design",
          "Computer Organization & Architecture Lab",
          "Data Science with Python Lab",
          "Web Technologies Lab",
        ],
        credits: [3, 3, 3, 3, 3, 1.5, 1.5, 1.5],
      },
      ECE: {
        names: [
          "Robotics Laboratory",
          "Communication Systems-1",
          "Communication Systems-1 Lab",
          "Digital System Design",
          "Digital System Design Lab",
          "Linear Integrated Circuits",
          "Linear Integrated Circuits Lab",
          "Electromagnetic Waves & Guided Media",
          "Foundations to Artificial Intelligence",
        ],
        credits: [2.5, 4, 1.5, 3, 1.5, 4, 1.5, 4, 1],
      },
      EEE: {
        names: [
          "Robotics Laboratory",
          "Power Systems-I",
          "Machine Learning",
          "Control Systems",
          "Control Systems Lab",
          "Linear Integrated Circuits",
          "Linear Integrated Circuits Lab",
          "Power Electronics",
          "Power Electronics Lab",
        ],
        credits: [1, 4, 3, 4, 1.5, 4, 1.5, 4, 1.5],
      },
      CIVIL: {
        names: [
          "Hydraulics Engineering",
          "Environmental Engineering-I",
          "Geo-Technical Engineering-I",
          "Structural Analysis",
          "Water Resources Engineering",
          "Introduction to Probability and Statistics",
          "Hydraulics Engineering Lab",
          "Geotechnical Engineering Lab",
        ],
        credits: [3, 3, 4, 4, 3, 3, 1.5, 1.5],
      },
      MECH: {
        names: [
          "Design of Machine Elements",
          "Dynamics of Machinery",
          "Fluid Mechanics & Hydraulic Machinery",
          "Metal Cutting and Machine Tools",
          "Probability and Statistics",
          "Metal cutting and Machine Tools Lab",
          "Fluid Mechanics & Hydraulic Machinery Lab",
        ],
        credits: [4, 4, 4, 4, 3, 1.5, 1.5],
      },
    },
  },
  E3: {
    "Sem - 1": {
      CSE: {
        names: [
          "Operating System",
          "Computer Networks",
          "Software Engineering",
          "Cloud Computing / Other Choosen",
          "Artificial Intelligence & Search methods",
          "Operating System Lab",
          "Computer Networks Lab",
          "Software Engineering Lab",
          "English-Language communication Skills Lab- II",
        ],
        credits: [3, 3, 3, 3, 3, 1.5, 1.5, 1.5, 1.5],
      },
      ECE: {
        names: [
          "Computer Networks",
          "Computer Organization & Design based on RISC V",
          "English-Language Communication Skills Lab-2",
          "Communication Systems-2",
          "Communication Systems-2 Lab",
          "Microprocessors Lab",
          "Radio Frequency & Microwave Engg. Lab",
          "Mini-Project-I (Socially Relevant Project)",
          "Product Design & Innovation Lab",
          "RF & Microwave Engineering",
        ],
        credits: [3, 3, 1.5, 4, 1.5, 1.5, 1.5, 1, 1, 2],
      },
      EEE: {
        names: [
          "Digital Signal Processing",
          "Power Systems-II",
          "Power Systems Lab",
          "English Language Communication Skills Lab-2",
          "Electrical Vehicles",
          "Electrical Vehicles Lab",
          "Embedded Systems",
          "Embedded Systems Lab",
          "Mini-Project-I (Socially Relevant Project)",
          "Product Design & Innovation Lab",
        ],
        credits: [3, 4, 1.5, 1.5, 3, 1.5, 3, 1.5, 1, 1],
      },
      CIVIL: {
        names: [
          "Advanced Structural Analysis",
          "Design of Reinforced Concrete Structures",
          "Environmental Engineering-II",
          "Geo-Technical Engineering-II",
          "English Language Communication Skills Lab-II",
          "Environmental Engineering Lab",
          "Concrete Technology Lab",
          "Computer Applications in Civil Engineering Lab",
          "Aptitude & Reasoning",
        ],
        credits: [4, 4, 3, 3, 1.5, 1.5, 1.5, 1.5, 0],
      },
      MECH: {
        names: [
          "Heat Transfer",
          "Robotics & Automation",
          "Applied Thermodynamics",
          "Metrology and Mechanical Measurements",
          "Metrology and Mechanical Measurements Lab",
          "Heat Transfer Lab",
          "Applied Thermodynamics Lab",
          "English Language Communication Skills Lab-II",
        ],
        credits: [4, 3, 4, 3, 1.5, 1.5, 1.5, 1.5],
      },
    },
    "Sem - 2": {
      CSE: {
        names: [
          "Cryptography and Networks Security",
          "Artificial Intelligence",
          "Elective II",
          "Elective III",
          "Open Elective-I",
          "English-Language communication Skills Lab-I -III",
          "Mini Project",
          "Summer Internship",
        ],
        credits: [4, 4, 3, 3, 3, 1.5, 3, 3],
      },
      ECE: {
        names: [
          "English-Language Communication Skills Lab-3",
          "Indian Constitution",
          "Elective-1",
          "Elective-2",
          "Open Elective-1",
          "Open Elective-2",
          "Mini Project-II",
          "Career Development Course",
        ],
        credits: [1.5, 0, 3, 3, 3, 3, 1.5, 0],
      },
      EEE: {
        names: [
          "English Language Communication skills lab-3",
          "Elective-1",
          "Elective-2",
          "Open Elective-1",
          "Open Elective-2",
          "Mini Project-II",
        ],
        credits: [1.5, 3, 3, 3, 3, 1],
      },
      CIVIL: {
        names: [
          "Building Planning and Drawing",
          "Design of Steel Structures",
          "Transportation Engineering-I",
          "Estimation and Costing",
          "Professional Elective Course-I",
          "English Language Communication Skills Lab-III",
          "Transportation Engineering Lab",
          "Personality and Professional Development Skills",
          "Summer Internship",
        ],
        credits: [2.5, 4, 3, 3, 3, 1.5, 1.5, 1.5, 3],
      },
      MECH: {
        names: [
          "Operations Research",
          "Finite Element Method",
          "Managerial Economics and Financial Analysis",
          "Program Elective Course-1",
          "Program Elective Course-2",
          "Computer Aided Modeling and Simulation Lab",
          "English Language Communication Skills Lab-III",
        ],
        credits: [4, 4, 3, 3, 3, 1.5, 1.5],
      },
    },
  },
  E4: {
    "Sem - 1": {
      CSE: {
        names: [
          "Elective-V",
          "Open Elective-III",
          "Open Elective-IV",
          "Project-II",
          "Community Service",
        ],
        credits: [3, 3, 3, 6, 2],
      },
      ECE: {
        names: [
          "Elective-3",
          "Elective-4",
          "Open Elective-3",
          "Summer Internship Project",
          "Project I",
          "Environmental Science",
        ],
        credits: [3, 3, 3, 3, 4, 0],
      },
      EEE: {
        names: [
          "Elective-3",
          "Elective-4",
          "Open Elective-3",
          "Summer Internship Project",
          "Project-I",
        ],
        credits: [3, 3, 3, 3, 4],
      },
      CIVIL: {
        names: [
          "Professional Elective Course-2/MOOC-1",
          "Professional Elective Course-3",
          "Professional Elective Course-4",
          "Open Elective Course-1",
          "Project-1",
          "Seminar",
        ],
        credits: [3, 3, 3, 3, 4, 0],
      },
      MECH: {
        names: [
          "Program Elective Course-3",
          "Open Elective Course-1",
          "Open Elective Course-2",
          "Project",
        ],
        credits: [3, 3, 3, 4.5],
      },
    },
    "Sem - 2": {
      CSE: {
        names: [
          "Elective-VI",
          "Open Elective-III",
          "Open Elective-IV",
          "Project-II",
          "Community Service",
        ],
        credits: [3, 3, 3, 6, 2],
      },
      ECE: {
        names: [
          "Community Service",
          "Elective-5",
          "Open Elective-4",
          "Project-II & Dissertation",
        ],
        credits: [2, 3, 3, 6],
      },
      EEE: {
        names: [
          "Community Service",
          "Elective-5",
          "Open Elective-4",
          "Project-II & Dissertation",
        ],
        credits: [2, 3, 3, 6],
      },
      CIVIL: {
        names: [
          "Professional Elective Course-5",
          "Open Elective Course-3/MOOC-2",
          "Open Elective Course-4",
          "Project-2",
          "Community Services",
        ],
        credits: [3, 3, 3, 5, 2],
      },
      MECH: {
        names: [
          "Program Elective Course-4",
          "Open Elective Course-3",
          "Open Elective Course-4",
          "Community Service",
          "Project",
        ],
        credits: [3, 3, 3, 2, 6],
      },
    },
  },
};

async function main() {
  console.log("Starting safe subject seeding...");

  const semMap: Record<string, string> = {
    "Sem - 1": "SEM-1",
    "Sem - 2": "SEM-2",
  };

  const allSubjects: any[] = [];

  Object.entries(subjectsData).forEach(([yearKey, semData]: [string, any]) => {
    Object.entries(semData).forEach(([semKey, branchData]: [string, any]) => {
      const normalizedSem = semMap[semKey] || semKey;

      Object.entries(branchData).forEach(
        ([branchKey, details]: [string, any]) => {
          const { names, credits } = details;

          names.forEach((name: string, index: number) => {
            if (!name || name.trim() === "") return;
            if (credits[index] === undefined) return;

            const idxStr = (index + 1).toString().padStart(2, "0");
            const code = `${branchKey}-${yearKey}-${normalizedSem}-${idxStr}`;

            allSubjects.push({
              id: code,   // Subject.id has no @default, use code as stable ID
              code,
              name,
              credits: credits[index], // Now supports precise Float values (e.g. 1.5, 2.5)
              department: branchKey,
              semester: normalizedSem,
            });
          });
        },
      );
    });
  });

  console.log(`Prepared ${allSubjects.length} subjects. Upserting...`);

  let count = 0;
  for (const sub of allSubjects) {
    await prisma.subject.upsert({
      where: { code: sub.code },
      update: {
        name: sub.name,
        credits: sub.credits,
        department: sub.department,
        semester: sub.semester,
      },
      create: sub,
    });
    count++;
    if (count % 50 === 0) console.log(`Processed ${count} subjects...`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
