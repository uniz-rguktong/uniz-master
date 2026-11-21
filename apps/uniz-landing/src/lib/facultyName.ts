// The department feed glues the qualification onto the name with no space,
// e.g. "Mr.N.Chandra SekharM.Tech, (PhD.)". Split it at the first degree token
// that follows a letter directly, so the two can be shown on separate lines.
const DEGREE_START = /^(#|Ph\.?\s?D|P\.hD|B\.?\s?Tech|MBA\b|AP-TS\b|M\.?\s?(Tech|TECH|Sc|SC|sc|E|A|Phil|Ed)\b)/;

export function splitFacultyName(raw: string): { name: string; qualification: string } {
  const text = (raw ?? "").trim();
  for (let i = 1; i < text.length; i += 1) {
    if (!/[A-Za-z]/.test(text[i - 1])) continue;
    if (DEGREE_START.test(text.slice(i))) {
      const qualification = text
        .slice(i)
        .replace(/#/g, " ")
        .replace(/[\s,]*\n[\s,]*/g, ", ")
        .replace(/\s+/g, " ")
        .replace(/^[\s,]+|[\s,]+$/g, "");
      return { name: text.slice(0, i).replace(/\s+/g, " ").trim(), qualification };
    }
  }
  return { name: text.replace(/\s+/g, " "), qualification: "" };
}
