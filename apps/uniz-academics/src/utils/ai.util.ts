import axios from "axios";

/**
 * Generates a motivational message based on student academic performance.
 */
export const generateMotivation = async (
  gpaSummary: any,
  attendanceSummary: any = null,
): Promise<string> => {
  try {
    const gpaEntries = Object.entries(gpaSummary)
      .map(
        ([sem, data]: [string, any]) =>
          `${sem}: GPT ${data.gpa} (${data.status})`,
      )
      .join(", ");

    const attendanceText = attendanceSummary
      ? `Attendance: ${attendanceSummary.overallPercentage}% (${attendanceSummary.status})`
      : "";

    const prompt = `Student Academic Profile:
        GPA Summary: ${gpaEntries}
        ${attendanceText}
        
        Based on these results, generate a short, high-impact motivational message for the student. If they are doing well, encourage them to maintain excellence. If they have failed records or low GPA, give them a powerful boost to keep trying. Keep it under 250 characters. Be direct and premium in tone.`;

    const payload = {
      messages: [
        {
          role: "system",
          content:
            "You are a world-class academic mentor. You provide pithy, powerful, and deeply motivational advice based on performance data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true, // Using streaming as requested
      cache_prompt: true,
      samplers: "edkypmxt",
      temperature: 0.8,
      dynatemp_range: 0,
      dynatemp_exponent: 1,
      top_k: 40,
      top_p: 0.95,
      min_p: 0.05,
      typical_p: 1,
      xtc_probability: 0,
      xtc_threshold: 0.1,
      repeat_last_n: 64,
      repeat_penalty: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      dry_multiplier: 0,
      dry_base: 1.75,
      dry_allowed_length: 2,
      dry_penalty_last_n: -1,
      max_tokens: 100,
      timings_per_token: false,
    };

    const response = await axios.post(
      "https://anandvelpuri-testingllm.hf.space/v1/chat/completions",
      payload,
      {
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          origin: "https://anandvelpuri-testingllm.hf.space",
          referer: "https://anandvelpuri-testingllm.hf.space/",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
        },
        responseType: "stream",
        timeout: 10000,
      },
    );

    return new Promise((resolve, reject) => {
      let fullText = "";
      let buffer = "";

      response.data.on("data", (chunk: any) => {
        const textChunk = chunk.toString();
        buffer += textChunk;

        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          const dataStr = trimmedLine.replace("data: ", "").trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices[0]?.delta?.content || "";
            fullText += content;
          } catch (e) {
            // CRITICAL: Don't ignore. If JSON is incomplete, prepend it back to the buffer
            // so it can be re-evaluated when more data arrives in the next chunk.
            buffer = line + "\n" + buffer;
            break; // Exit the line processing for this chunk
          }
        }
      });

      response.data.on("end", () => {
        // Process any remaining data in buffer
        if (buffer.startsWith("data: ")) {
          try {
            const dataStr = buffer.replace("data: ", "").trim();
            if (dataStr !== "[DONE]") {
              const parsed = JSON.parse(dataStr);
              fullText += parsed.choices[0]?.delta?.content || "";
            }
          } catch (e) {}
        }

        const finalResult = fullText.trim();
        console.log(`[AI] Generation complete. Length: ${finalResult.length}`);
        resolve(finalResult || "Rise above. Your best is yet to come.");
      });

      response.data.on("error", (err: any) => {
        console.error("[AI] Stream error:", err);
        reject(err);
      });
    });
  } catch (error: any) {
    console.error("AI Motivation Generation failed:", error.message);
    return "Keep pushing forward. Consistency is the key to success.";
  }
};
