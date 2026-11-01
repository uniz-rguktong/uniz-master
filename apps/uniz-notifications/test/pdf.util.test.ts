import { beforeEach, describe, expect, it, vi } from "vitest";

const docs = vi.hoisted(() => ({ list: [] as any[] }));
const fsState = vi.hoisted(() => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));
const axiosGet = vi.hoisted(() => vi.fn());

vi.mock("pdfkit", () => ({
  default: class PDFDocument {
    constructor() {
      const doc = {
        page: { width: 600, height: 800 },
        y: 40,
        pages: 1,
        texts: [] as string[],
        fills: [] as string[],
        fillColors: [] as string[],
        images: 0,
        listeners: {} as Record<string, Function>,
        on(event: string, cb: Function) {
          this.listeners[event] = cb;
          return this;
        },
        end() {
          this.listeners.data?.(Buffer.from("%PDF-1.4"));
          this.listeners.end?.();
          return this;
        },
        rect() {
          return this;
        },
        lineWidth() {
          return this;
        },
        strokeColor() {
          return this;
        },
        stroke() {
          return this;
        },
        fill(color?: string) {
          if (color) this.fills.push(color);
          return this;
        },
        fillColor(color: string) {
          this.fillColors.push(color);
          return this;
        },
        font() {
          return this;
        },
        fontSize() {
          return this;
        },
        text(value: string) {
          this.texts.push(String(value));
          return this;
        },
        moveDown(n = 1) {
          this.y += 20 * n;
          return this;
        },
        image() {
          this.images += 1;
          return this;
        },
        heightOfString(text: string) {
          return text.length > 80 ? 700 : 12;
        },
        addPage() {
          this.pages += 1;
          this.y = 40;
          return this;
        },
        moveTo() {
          return this;
        },
        lineTo() {
          return this;
        },
      };
      docs.list.push(doc);
      return doc;
    }
  },
}));

vi.mock("fs", () => ({
  default: fsState,
  existsSync: fsState.existsSync,
  readFileSync: fsState.readFileSync,
  writeFileSync: fsState.writeFileSync,
  mkdirSync: fsState.mkdirSync,
}));

vi.mock("axios", () => ({
  default: { get: axiosGet },
}));

async function loadPdf() {
  vi.resetModules();
  docs.list.length = 0;
  return import("../src/mail/utils/pdf.util");
}

const grades = [
  {
    grade: 10,
    subject: { code: "MA101", name: "Mathematics (MA-101)", credits: 3 },
  },
  {
    grade: 8,
    subject: { code: "PH101", name: "Physics", credits: 1 },
  },
  {
    grade: 4,
    subject: { code: "XX000", name: "Lab", credits: 0 },
  },
  {
    grade: 4,
    subject: { code: "EN101", name: "English", credits: 2 },
  },
];

describe("pdf util", () => {
  beforeEach(() => {
    delete process.env.INSTITUTION_LOGO_URL;
    fsState.existsSync.mockReset();
    fsState.existsSync.mockReturnValue(false);
    fsState.readFileSync.mockReset();
    fsState.writeFileSync.mockReset();
    fsState.mkdirSync.mockReset();
    axiosGet.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("computes SGPA, grade letters, and cleaned subject names", async () => {
    const { generateResultPdf } = await loadPdf();
    const buffer = await generateResultPdf({
      username: "O1",
      name: "Ada",
      branch: "cse",
      campus: "Ongole",
      semesterId: "e1_s1",
      grades,
    });
    const doc = docs.list[0];
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    const text = doc.texts.join("\n");
    expect(text).toContain("SGPA: 7.67");
    expect(text).toContain("Mathematics");
    expect(text).not.toContain("Mathematics (MA-101)");
    expect(doc.texts).toContain("EX");
    expect(doc.texts).toContain("B");
    expect(doc.texts).toContain("R");
    expect(text).toContain("ADA");
    expect(text).toContain("CSE");
    expect(text).toContain("E1_S1");
    expect(text).toContain("ONGOLE");
    expect(text).toContain("3.0");
    expect(doc.fillColors).toContain("#D32F2F");
    expect(doc.images).toBe(0);
  });

  it("shows placeholders and a zero SGPA when the sheet is empty", async () => {
    const { generateResultPdf } = await loadPdf();
    await generateResultPdf({
      username: "O1",
      name: "O1",
      branch: "N/A",
      campus: "N/A",
      semesterId: "e2",
      grades: [],
    });
    const text = docs.list[0].texts.join("\n");
    expect(text).toContain("SGPA: 0.00");
    expect(text).toContain("--");
    expect(text).toContain("RGUKT");
    expect(text).toContain("E2");
  });

  it("starts a new page when a subject row is too tall", async () => {
    const { generateResultPdf } = await loadPdf();
    const longName = "A".repeat(90);
    await generateResultPdf({
      username: "O1",
      name: "Ada",
      branch: "CSE",
      campus: "",
      semesterId: "E3",
      grades: [
        {
          grade: 9,
          subject: { code: "CS1", name: longName, credits: 4 },
        },
        {
          grade: 7,
          subject: { code: "CS2", name: "Short", credits: 2 },
        },
        {
          grade: 6,
          subject: { code: "CS3", name: "Also short", credits: 2 },
        },
        {
          grade: 5,
          subject: { code: "CS4", name: "Pass", credits: 2 },
        },
      ],
    });
    const doc = docs.list[0];
    expect(doc.pages).toBeGreaterThan(1);
    const text = doc.texts.join("\n");
    expect(doc.texts).toContain("A");
    expect(doc.texts).toContain("C");
    expect(doc.texts).toContain("D");
    expect(doc.texts).toContain("E");
    expect(text).toContain("RGUKT");
    // 4*9 + 2*7 + 2*6 + 2*5 = 36+14+12+10 = 72 / 10 = 7.20
    expect(doc.texts).toContain("SGPA: 7.20");
  });

  it("colors attendance bands and totals the semester", async () => {
    const { generateAttendancePdf } = await loadPdf();
    await generateAttendancePdf({
      username: "O1",
      name: "Ada",
      branch: "ece",
      campus: "Ongole",
      semesterId: "e1",
      records: [
        {
          attendedClasses: 95,
          totalClasses: 100,
          subject: { code: "EC1", name: "Circuits (EC-1)" },
        },
        {
          attendedClasses: 80,
          totalClasses: 100,
          subject: { code: "EC2", name: "Signals" },
        },
        {
          attendedClasses: 10,
          totalClasses: 100,
          subject: { code: "EC3", name: "Labs" },
        },
        {
          attendedClasses: 0,
          totalClasses: 0,
          subject: { code: "EC4", name: "Seminar" },
        },
      ],
    });
    const doc = docs.list[0];
    expect(doc.texts).toContain("Circuits");
    expect(doc.texts).toContain("95.0%");
    expect(doc.texts).toContain("80.0%");
    expect(doc.texts).toContain("10.0%");
    expect(doc.texts).toContain("0.0%");
    expect(doc.texts).toContain("95 / 100");
    expect(doc.texts).toContain("OVERALL SEMESTER ATTENDANCE: ");
    expect(doc.texts).toContain("61.67%");
    expect(doc.texts.join("\n")).toContain("ADA");
    expect(doc.texts.join("\n")).toContain("ECE");
    expect(doc.fillColors).toContain("#1B5E20");
    expect(doc.fillColors).toContain("#000000");
    expect(doc.fillColors).toContain("#D32F2F");
    expect(doc.fills).toContain("#FFF2F2");
  });

  it("uses the healthy summary color when overall attendance is at least 75", async () => {
    const { generateAttendancePdf } = await loadPdf();
    await generateAttendancePdf({
      username: "O1",
      name: "O1",
      branch: "N/A",
      campus: "",
      semesterId: "e2",
      records: [
        {
          attendedClasses: 90,
          totalClasses: 100,
          subject: { code: "X", name: "Topic" },
        },
      ],
    });
    const doc = docs.list[0];
    expect(doc.texts.join("\n")).toContain("90.00%");
    expect(doc.texts.join("\n")).toContain("--");
    expect(doc.fills).toContain("#F2FFF2");
    expect(doc.fillColors).toContain("#1B5E20");
  });

  it("reads a cached logo, then fetches and stores one", async () => {
    process.env.INSTITUTION_LOGO_URL = "https://example.test/logo.jpg";
    fsState.existsSync.mockReturnValue(true);
    fsState.readFileSync.mockReturnValue(Buffer.from("cached-logo"));
    const { generateResultPdf } = await loadPdf();
    await generateResultPdf({
      username: "O1",
      name: "Ada",
      branch: "CSE",
      campus: "Ongole",
      semesterId: "E1",
      grades: [],
    });
    expect(docs.list[0].images).toBe(1);
    expect(axiosGet).not.toHaveBeenCalled();

    vi.resetModules();
    docs.list.length = 0;
    fsState.existsSync.mockReturnValue(false);
    axiosGet.mockResolvedValue({ data: Buffer.from("downloaded") });
    const fresh = await import("../src/mail/utils/pdf.util");
    await fresh.generateAttendancePdf({
      username: "O1",
      name: "Ada",
      branch: "CSE",
      campus: "Ongole",
      semesterId: "E1",
      records: [],
    });
    expect(axiosGet).toHaveBeenCalledWith(
      "https://example.test/logo.jpg",
      expect.objectContaining({ responseType: "arraybuffer", timeout: 10000 }),
    );
    expect(fsState.mkdirSync).toHaveBeenCalled();
    expect(fsState.writeFileSync).toHaveBeenCalled();
    expect(docs.list[0].images).toBe(1);

    axiosGet.mockClear();
    await fresh.generateResultPdf({
      username: "O1",
      name: "Ada",
      branch: "CSE",
      campus: "Ongole",
      semesterId: "E1",
      grades: [],
    });
    expect(axiosGet).not.toHaveBeenCalled();
    expect(docs.list[1].images).toBe(1);
  });

  it("still renders a PDF when the logo cache and the download fail", async () => {
    process.env.INSTITUTION_LOGO_URL = "https://example.test/logo.jpg";
    fsState.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    fsState.readFileSync.mockImplementation(() => {
      throw new Error("unreadable");
    });
    axiosGet.mockRejectedValue(new Error("offline"));
    const { generateResultPdf } = await loadPdf();
    const buffer = await generateResultPdf({
      username: "O1",
      name: "Ada",
      branch: "CSE",
      campus: "Ongole",
      semesterId: "E1",
      grades: [],
    });
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(docs.list[0].images).toBe(0);
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });
});
