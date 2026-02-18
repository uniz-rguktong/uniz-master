const XLSX = require("xlsx");
const fs = require("fs");

const students = [
  { username: "O210013", name: "PATHAN IRFANA KHANAM" },
  { username: "O210014", name: "CHIRAMANENI ROHITH" },
  { username: "O210025", name: "PATHAN IMRANA KHANAM" },
  { username: "O210030", name: "TUMMALA KEERTHI" },
  { username: "O210031", name: "BHIMA RUCHITHA" },
  { username: "O210036", name: "JAYA SRI VARDHAN SAMGOJU" },
  { username: "O210053", name: "INTI YUVA SRI" },
  { username: "O210066", name: "PASUPULETI VENKATA PADMA" },
  { username: "O210081", name: "ANKEPALLI VENKATA KALYANI" },
  { username: "O210087", name: "JONNADULA MOUNIKA" },
  { username: "O210099", name: "CHANDOLU KALYANI" },
  { username: "O210104", name: "JONNALAGADDA SANDEEP" },
  { username: "O210115", name: "VENKATA LEELADHAR ABBURI" },
  { username: "O210119", name: "SANIKOMMU VIJAYA BHASKAR REDDY" },
  { username: "O210129", name: "GANJANABOYINA TEJA SAI DEEPIKA" },
  { username: "O210137", name: "GOLLA NANDINI" },
  { username: "O210139", name: "DAMARLA SEETHA RAM PRAVEEN" },
  { username: "O210143", name: "PADAMATI RAGHURAMAIAH" },
  { username: "O210173", name: "RANGANAPALEM KOTESWARA RAO" },
  { username: "O210191", name: "BALLA HARSHITHA" },
  { username: "O210193", name: "MAKKENA ARAVIND" },
  { username: "O210195", name: "CHEGIREDDY MADHUSUDHAN REDDY" },
  { username: "O210213", name: "NAIDU PAVAN" },
  { username: "O210218", name: "SHAIK YOUNUS" },
  { username: "O210219", name: "KSHATRI RISHITHA BAI" },
  { username: "O210221", name: "CHILLAPALLI THRUSHNA DEEPIKA" },
  { username: "O210225", name: "DANDU ESWARA LAKSHMI" },
  { username: "O210241", name: "MEENUGA ARYA" },
  { username: "O210248", name: "MUKKALA ASHINI" },
  { username: "O210273", name: "UPPALAPATI ADHIKSHA REDDY" },
  { username: "O210282", name: "NUTHAKKI BHARGAVI" },
  { username: "O210283", name: "GOGINENI VIJAYALAKSHMI" },
  { username: "O210292", name: "SIVALA DEVI SRI PRSAD" },
  { username: "O210302", name: "KOMMASANI SRAVANTHI" },
  { username: "O210306", name: "NARABOINA VENKATADRI" },
  { username: "O210307", name: "BEVARA MANIKANTA" },
  { username: "O210314", name: "VADDEMGUNTA DHARANI" },
  { username: "O210318", name: "MALLIREDDY GUNALAKSHMISRUTHI" },
  { username: "O210329", name: "ALAHARI BHANU PRAKASH" },
  { username: "O210339", name: "AINAVILLI SATISH" },
  { username: "O210353", name: "CHUNDURI KARUNYA" },
  { username: "O210377", name: "PALLI ANUSHA" },
  { username: "O210396", name: "GUNDA TRIVENI" },
  { username: "O210415", name: "MADDU VISHNU VARDHAN" },
  { username: "O210427", name: "KAMANURU PRASANTHI" },
  { username: "O210429", name: "YELLAPU HARSHA" },
  { username: "O210433", name: "MUKTAPURAM PAVANARUPA" },
  { username: "O210435", name: "PEDDINTI SRAVANI" },
  { username: "O210446", name: "ASAPANNA SRIHARI" },
  { username: "O210449", name: "KAMMARI TEJESWAR ACHARI" },
  { username: "O210459", name: "RAMIREDDY HARATHI" },
  { username: "O210462", name: "MEDURU SUNANDA" },
  { username: "O210473", name: "SRUTHI UDATHA" },
  { username: "O200724", name: "GUNA VENKATA SAI KUMAR" },
  { username: "O210533", name: "MANNURU HARSHITH REDDY" },
  { username: "O210604", name: "K.Sruthi" },
  { username: "O210609", name: "NIMMAKAYALA JAHNAVI" },
  { username: "O210647", name: "HANUMANTHU SATYANARAYANA" },
  { username: "O210652", name: "KONA SRI NAGA VENKATA ANAND SAI" },
  { username: "O210667", name: "MADANU KUMAR JOSEPH MARIYA NIKHIL" },
  { username: "O210687", name: "KALAVALA VENKATA NAGA SUSMITHA" },
  { username: "O210731", name: "CHINTHA BHAVYA SAHITHI" },
  { username: "O210773", name: "GUMPENA SAI VENKAT" },
  { username: "O210786", name: "BITRA DEDEEPYA" },
  { username: "O210791", name: "MADICHARLA NAGA MOHAN" },
  { username: "O210818", name: "PILLI SRUJANA" },
  { username: "O210828", name: "K. AKHILA" },
  { username: "O210829", name: "VELPURI ANAND" },
  { username: "O210835", name: "MANNEPALLI PRIYANKA" },
  { username: "O210842", name: "SHAIK ARIFA" },
  { username: "O210855", name: "SHAIK KHADEER" },
  { username: "O210860", name: "SHAIK AYESHA AYUB" },
  { username: "O210870", name: "YADALA VASAVI" },
  { username: "O210880", name: "MUNDRU HARIKA" },
  { username: "O210896", name: "KOTHA MANASA" },
  { username: "O210900", name: "SWARNA RAJASEKHAR" },
  { username: "O210910", name: "MOTURU SREESANTH" },
  { username: "O210947", name: "KOMARABATHINA YONATHANU" },
  { username: "O210963", name: "RAMOJI THOSHAN KUMAR" },
  { username: "O210970", name: "MEMMERLA PRAJWALITHA" },
  { username: "O210999", name: "PALTHE KARTHIK NAIK" },
  { username: "O211022", name: "SRIRAMULA BHARATHI" },
  { username: "O211049", name: "BASIREDDY JAYA SANKAR REDDY" },
  { username: "O211105", name: "EDULAMUDI VENNELA" },
  { username: "O210768", name: "SUDDULA MADHU MEGHANA" },
  { username: "O210007", name: "RAMAVATH BHARGAVI BAI" },
  { username: "O210008", name: "SABER Desu" },
];

const subjects = [
  { code: "E2-SEM-1-CSE-1", name: "Probability and Statistics" },
  { code: "E2-SEM-1-CSE-2", name: "Digital Logic Design" },
  { code: "E2-SEM-1-CSE-3", name: "Design & Analysis of Algorithms" },
  { code: "E2-SEM-1-CSE-4", name: "Database Management Systems" },
  { code: "E2-SEM-1-CSE-5", name: "Formal Languages & Automata Theory" },
  { code: "E2-SEM-1-CSE-6", name: "Design & Analysis of Algorithms Lab" },
  { code: "E2-SEM-1-CSE-7", name: "Digital Logic Design Lab" },
  { code: "E2-SEM-1-CSE-8", name: "Database Management Systems Lab" },
];

const gradeHeaders = [
  [
    "Student ID",
    "Student Name",
    "Subject Code",
    "Subject Name",
    "Semester ID",
    "Grade (EX, A, B, C, D, E, R)",
  ],
];
const sampleGrades = [
  "EX",
  "A",
  "B",
  "C",
  "D",
  "E",
  "R",
  "8.5",
  "9.2",
  "7.0",
  "INVALID_TEXT",
  "",
]; // Added 'INVALID_TEXT' and empty string

students.forEach((s, sIdx) => {
  subjects.forEach((sub, subIdx) => {
    let grade;
    // Specifically add "BAD DATA" at known intervals to test validation
    if (sIdx === 0 && subIdx === 0) grade = "INVALID_DATA";
    else if (sIdx === 1 && subIdx === 0) grade = "???";
    else if (sIdx === 2 && subIdx === 0) grade = "Pending";
    else {
      grade = sampleGrades[(sIdx + subIdx) % sampleGrades.length];
    }
    gradeHeaders.push([s.username, s.name, sub.code, sub.name, "SEM-1", grade]);
  });
});

const wbGrades = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  wbGrades,
  XLSX.utils.aoa_to_sheet(gradeHeaders),
  "Template",
);
fs.writeFileSync(
  "/Users/sreecharandesu/Projects/uniz-rguktong/tests/data/full_batch_grades.xlsx",
  XLSX.write(wbGrades, { type: "buffer", bookType: "xlsx" }),
);

console.log(
  "Regenerated grades template with intentionally INVALID strings (INVALID_DATA, ???, Pending) to test API validation.",
);
