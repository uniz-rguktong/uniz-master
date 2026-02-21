const d = new Date();
const s = d.toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
console.log(s);
