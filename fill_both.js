const ExcelJS = require("exceljs");
const axios = require("axios");
const fs = require("fs");

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NzM4YmUwLTUxMjItNGRjMS04NWMxLTFhZTIwZjRjM2E0OCIsInVzZXJuYW1lIjoiV0VCTUFTVEVSIiwicm9sZSI6IndlYm1hc3RlciIsImlhdCI6MTc3MjcxMDM0NSwiZXhwIjoxNzczMzE1MTQ1fQ.K3k_dyVhCrL1gUAF4eoprGoyPyyiV_sfq3j6rFLQQsc";

async function run() {
    try {
        console.log("Downloading Attendance Template...");
        const attRes = await axios.get("https://uniz.rguktong.in/api/v1/academics/attendance/template?branch=CSE&year=E2&semesterId=SEM-1", {
            headers: { Authorization: `Bearer ${TOKEN}` },
            responseType: "arraybuffer"
        });
        fs.writeFileSync("/tmp/att_temp.xlsx", attRes.data);

        console.log("Downloading Grades Template...");
        const grdRes = await axios.get("https://uniz.rguktong.in/api/v1/academics/grades/template?branch=CSE&year=E2&semesterId=SEM-1", {
            headers: { Authorization: `Bearer ${TOKEN}` },
            responseType: "arraybuffer"
        });
        fs.writeFileSync("/tmp/grd_temp.xlsx", grdRes.data);

        const w1 = new ExcelJS.Workbook();
        await w1.xlsx.readFile("/tmp/att_temp.xlsx");
        const s1 = w1.getWorksheet(1);
        s1.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const c6 = row.getCell(6); // Total
            const c7 = row.getCell(7); // Attended
            c6.value = 50;
            c7.value = 45; 
        });
        await w1.xlsx.writeFile("/Users/sreecharandesu/Projects/uniz-master/attendance_filled.xlsx");

        const w2 = new ExcelJS.Workbook();
        await w2.xlsx.readFile("/tmp/grd_temp.xlsx");
        const s2 = w2.getWorksheet(1);
        const grades = ["EX", "A", "B", "C", "D"];
        s2.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const c6 = row.getCell(6); // Grade
            c6.value = grades[Math.floor(Math.random() * grades.length)]; 
        });
        await w2.xlsx.writeFile("/Users/sreecharandesu/Projects/uniz-master/final_grades_filled.xlsx");

        console.log("Both files generated successfully!");
    } catch(e) {
        console.error(e.message || e);
    }
}
run();
