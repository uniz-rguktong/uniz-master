const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configuration
const SERVICES = {
  AUTH: "http://localhost:3001",
  USER: "http://localhost:3002",
  ACADEMICS: "http://localhost:3004",
};

const SUBJECTS_DATA = {
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
          "",
          "",
        ],
        credits: [4, 4, 4, 2.5, 2.5, 1.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
        hide: [],
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
          "",
          "",
        ],
        credits: [3, 4, 4, 2.5, 1.5, 2.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
          "",
        ],
        credits: [4, 2.5, 4, 4, 3, 1.5, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
        ],
        credits: [4, 4, 3, 4, 3, 1.5, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
        ],
        credits: [4, 2, 1.5, 1.5, 2.5, 4, 1.5, 4, 4, 0],
        hide: [9],
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
        credits: [4, 4, 1.5, 1.5, 2.5, 4, 1.5, 4, 1, 0],
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
          "",
          "",
        ],
        credits: [3, 4, 3, 4, 3, 1.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
          "",
          "",
        ],
        credits: [4, 4, 3, 3, 2.5, 1.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
          "",
        ],
        credits: [4, 3, 4, 3, 3, 1.5, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
        ],
        credits: [3, 1.5, 4, 1.5, 4, 1.5, 4, 1.5, 3, 0],
        hide: [9],
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
        credits: [3, 1, 4, 1.5, 3, 1, 4, 4, 1.5, 0],
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
          "",
        ],
        credits: [3, 3, 3, 3, 4, 4, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
          "",
        ],
        credits: [4, 4, 4, 4, 3, 1.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
          "",
        ],
        credits: [3, 3, 3, 3, 3, 1.5, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
        ],
        credits: [2.5, 4, 1.5, 3, 1.5, 4, 1.5, 4, 1, 0],
        hide: [9],
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
        credits: [1, 4, 3, 4, 1.5, 4, 1.5, 4, 1.5, 0],
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
          "",
          "",
        ],
        credits: [3, 3, 4, 4, 3, 3, 1.5, 1.5, 0, 0],
        hide: [8, 9],
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
          "",
          "",
        ],
        credits: [4, 4, 4, 4, 3, 1.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
        credits: [3, 3, 3, 3, 3, 1.5, 1.5, 1.5, 1.5, 0],
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
        hide: [],
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
        show: [10],
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
          "",
        ],
        credits: [4, 4, 3, 3, 1.5, 1.5, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
        ],
        credits: [4, 3, 4, 3, 1.5, 1.5, 1.5, 1.5, 0, 0],
        hide: [9],
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
          "",
          "Summer Internship",
        ],
        credits: [4, 4, 3, 3, 3, 1.5, 3, 0, 3, 0],
        hide: [8],
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
          "",
          "",
        ],
        credits: [1.5, 0, 3, 3, 3, 3, 1.5, 0, 0, 0],
        hide: [8, 9],
      },
      EEE: {
        names: [
          "English Language Communication skills lab-3",
          "Elective-1",
          "Elective-2",
          "Open Elective-1",
          "Open Elective-2",
          "Mini Project-II",
          "",
          "",
          "",
        ],
        credits: [1.5, 3, 3, 3, 3, 1, 0, 0, 0, 0],
        hide: [7, 8, 9],
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
          "",
        ],
        credits: [2.5, 4, 3, 3, 3, 1.5, 1.5, 1.5, 3, 0],
        hide: [9],
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
          "",
          "",
        ],
        credits: [4, 4, 3, 3, 3, 1.5, 1.5, 0, 0, 0],
        hide: [8, 9],
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
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 6, 2, 0, 0, 0, 0, 0],
        hide: [6, 7, 8, 9],
      },
      ECE: {
        names: [
          "Elective-3",
          "Elective-4",
          "Open Elective-3",
          "Summer Internship Project",
          "Project I",
          "Environmental Science",
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 3, 4, 0, 0, 0, 0, 0],
        hide: [6, 7, 8, 9],
      },
      EEE: {
        names: [
          "Elective-3",
          "Elective-4",
          "Open Elective-3",
          "Summer Internship Project",
          "Project-I",
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 3, 4, 0, 0, 0, 0, 0],
        hide: [6, 7, 8, 9],
      },
      CIVIL: {
        names: [
          "Professional Elective Course-2/MOOC-1",
          "Professional Elective Course-3",
          "Professional Elective Course-4",
          "Open Elective Course-1",
          "Project-1",
          "Seminar",
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 3, 4, 0, 0, 0, 0, 0],
        hide: [6, 7, 8, 9],
      },
      MECH: {
        names: [
          "Program Elective Course-3",
          "Open Elective Course-1",
          "Open Elective Course-2",
          "Project",
          "",
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 4.5, 0, 0, 0, 0, 0, 0],
        hide: [5, 6, 7, 8, 9],
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
          "",
        ],
        credits: [4, 4, 3, 4, 3, 1.5, 1.5, 1.5, 0, 0],
        hide: [6, 7, 8, 9],
      },
      ECE: {
        names: [
          "Community Service",
          "Elective-5",
          "Open Elective-4",
          "Project-II & Dissertation",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
        credits: [2, 3, 3, 6, 0, 0, 0, 0, 0, 0],
        hide: [5, 6, 7, 8, 9],
      },
      EEE: {
        names: [
          "Community Service",
          "Elective-5",
          "Open Elective-4",
          "Project-II & Dissertation",
          "",
          "",
          "",
          "",
          "",
        ],
        credits: [2, 3, 3, 6, 0, 0, 0, 0, 0, 0],
        hide: [5, 6, 7, 8, 9],
      },
      CIVIL: {
        names: [
          "Professional Elective Course-5",
          "Open Elective Course-3/MOOC-2",
          "Open Elective Course-4",
          "Project-2",
          "Community Services",
          "",
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 5, 2, 0, 0, 0, 0, 0],
        hide: [5, 6, 7, 8, 9],
      },
      MECH: {
        names: [
          "Program Elective Course-4",
          "Open Elective Course-3",
          "Open Elective Course-4",
          "Community Service",
          "Project",
          "",
          "",
          "",
          "",
        ],
        credits: [3, 3, 3, 2, 6, 0, 0, 0, 0, 0],
        hide: [6, 7, 8, 9],
      },
    },
  },
};

const CODE_TO_ID = {};

const ADMINS = [
  { username: "director", password: "director@uniz", role: "director" },
  { username: "webmaster", password: "webmaster@uniz", role: "webmaster" },
  { username: "dean", password: "dean@uniz", role: "dean" },
  {
    username: "caretaker_female",
    password: "caretaker@uniz",
    role: "caretaker_female",
  },
  {
    username: "caretaker_male",
    password: "caretaker@uniz",
    role: "caretaker_male",
  },
  { username: "swo", password: "swo@uniz", role: "swo" },
  {
    username: "warden_male",
    password: "warden_male@uniz",
    role: "warden_male",
  },
  {
    username: "warden_female",
    password: "warden_female@uniz",
    role: "warden_female",
  },
  { username: "security", password: "security@uniz", role: "security" },
  {
    username: "librarian_admin",
    password: "librarian@uniz",
    role: "librarian",
  },
];

async function seedAdmins() {
  console.log("\n--- Seeding Admins ---");
  for (const admin of ADMINS) {
    try {
      await axios.post(`${SERVICES.AUTH}/signup`, admin);
      console.log(`✅ Created Admin: ${admin.username}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️  Admin exists: ${admin.username}`);
      } else {
        console.error(`❌ Failed to create ${admin.username}:`, error.message);
      }
    }
  }
}

async function seedCurriculum(adminToken) {
  if (!adminToken) return;
  console.log("\n--- Seeding Curriculum ---");

  for (const [year, sems] of Object.entries(SUBJECTS_DATA)) {
    for (const [sem, branches] of Object.entries(sems)) {
      const semId = sem.replace("Sem - ", "SEM-");

      for (const [branch, data] of Object.entries(branches)) {
        const { names, credits } = data;

        for (let i = 0; i < names.length; i++) {
          const subjectName = names[i];
          if (!subjectName) continue;

          const subCode = `${year}-${semId}-${branch}-${i + 1}`.toUpperCase();
          const subCredit = credits[i] || 0;

          try {
            const res = await axios.post(
              `${SERVICES.ACADEMICS}/subjects/add`,
              {
                code: subCode,
                name: subjectName,
                credits: subCredit,
                department: branch,
                semester: semId,
              },
              {
                headers: { Authorization: `Bearer ${adminToken}` },
              },
            );

            if (res.data.success && res.data.subject) {
              CODE_TO_ID[subCode] = res.data.subject.id;
            }
          } catch (e) {
            // console.error(`Error adding ${subCode}: ${e.message}`);
          }
        }
      }
    }
  }
  console.log("\n✅ Curriculum Seeded & Mapped");
}

async function seedStudents(adminToken) {
  console.log("\n--- Seeding Students ---");

  const filePath = path.join(__dirname, "../testdata.txt");
  if (!fs.existsSync(filePath)) {
    console.error("❌ testdata.txt not found!");
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    if (!line.trim() || line.startsWith("idx")) continue;

    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [idx, username, name] = parts;
    if (username === "username") continue;

    process.stdout.write(`Student ${username}... `);

    try {
      // 1. Signup
      try {
        await axios.post(`${SERVICES.AUTH}/signup`, {
          username,
          password: "password123",
          role: "student",
        });
      } catch (e) {
        if (e.response?.status !== 409) throw e;
      }

      // 2. Login
      const loginRes = await axios.post(`${SERVICES.AUTH}/login`, {
        username,
        password: "password123",
      });
      const studentToken = loginRes.data.token;

      // 3. Update Profile
      let year = "E3";
      if (username.startsWith("O20") || username.startsWith("N20")) year = "E4";
      if (username.startsWith("O21") || username.startsWith("N21")) year = "E3";
      if (username.startsWith("O22") || username.startsWith("N22")) year = "E2";
      if (username.startsWith("O23") || username.startsWith("N23")) year = "E1";

      const branch = "CSE";

      await axios.put(
        `${SERVICES.USER}/student/update`,
        {
          name: name,
          branch: branch,
          year: year.replace("E", ""),
          email: username.toLowerCase() + "@rguktong.ac.in",
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` },
        },
      );

      // 4. Add Grades
      if (adminToken) {
        const semLabel = "Sem - 1";
        const semId = "SEM-1";

        const subjects = SUBJECTS_DATA[year]?.[semLabel]?.[branch];

        if (subjects) {
          const gradePayload = {
            studentId: username,
            semesterId: semId,
            grades: [],
          };

          for (let i = 0; i < subjects.names.length; i++) {
            const subName = subjects.names[i];
            if (!subName) continue;

            const subCode = `${year}-${semId}-${branch}-${i + 1}`.toUpperCase();
            const randomGrade = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
            const subjectId = CODE_TO_ID[subCode];

            if (subjectId) {
              gradePayload.grades.push({
                subjectId: subjectId,
                grade: randomGrade,
              });

              // Seed Attendance
              const totalClasses = 60;
              const attendedClasses =
                Math.floor(Math.random() * (totalClasses - 40 + 1)) + 40; // 40-60

              try {
                await axios.post(
                  `${SERVICES.ACADEMICS}/attendance/add`,
                  {
                    subjectId: subjectId,
                    records: [
                      {
                        studentId: username,
                        semesterId: semId,
                        attended: attendedClasses,
                        total: totalClasses,
                      },
                    ],
                  },
                  {
                    headers: { Authorization: `Bearer ${adminToken}` },
                  },
                );
              } catch (err) {}
            }
          }

          if (gradePayload.grades.length > 0) {
            try {
              await axios.post(
                `${SERVICES.ACADEMICS}/grades/add`,
                gradePayload,
                {
                  headers: { Authorization: `Bearer ${adminToken}` },
                },
              );
            } catch (err) {
              // console.log(`Grades failed ${username}`);
            }
          }
        }
      }
      console.log("✅");
    } catch (error) {
      console.log(`❌`);
    }
  }
}

async function main() {
  let adminToken = "";

  // 1. Try initial login (might fail if fresh DB)
  try {
    const res = await axios.post(`${SERVICES.AUTH}/login`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    adminToken = res.data.token;
    console.log("🔑 Admin Logged In (Initial)");
  } catch (e) {
    console.log("ℹ️  Initial admin login failed (expected on fresh DB)");
  }

  // 2. Seed Admins (creates webmaster)
  await seedAdmins();

  // 3. Login again if needed
  if (!adminToken) {
    try {
      console.log("🔄 Attempting login after seeding admins...");
      const res = await axios.post(`${SERVICES.AUTH}/login`, {
        username: "webmaster",
        password: "webmaster@uniz",
      });
      adminToken = res.data.token;
      console.log("🔑 Admin Logged In (Retry Successful)");
    } catch (e) {
      console.error("❌ Admin login failed after seeding!", e.message);
      process.exit(1);
    }
  }

  // 4. Seed rest
  await seedCurriculum(adminToken);
  await seedStudents(adminToken);
  console.log("\n✅ Seeding Complete");
}

main();
