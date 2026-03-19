// AI Step — Gemini Integration
// Customer message → Gemini → Intent / Priority / Summary

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeText = async (text) => {
  try {
    // -> guard against undefined/null text — should never reach Gemini empty
    if (!text || text.trim() === "") {
      console.warn("⚠ analyzeText called with empty input");
      return {
        intent:   "unknown",
        priority: "low",
        summary:  "No input provided for AI analysis",
      };
    }

    console.log("🤖 Calling Gemini AI...");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Analyze the following customer message and respond ONLY in this exact format (no extra text):

Intent: <one of: complaint, refund_request, order_inquiry, shipping_inquiry, general_inquiry, technical_issue, praise>
Priority: <one of: high, medium, low>
Summary: <one sentence summary of the issue>

Message: "${text}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ Gemini response received");
    // console.log("Raw response:", responseText);

    // parse structured response
    const intent   = responseText.match(/Intent:\s*(.+)/i)?.[1]?.trim()   || "unknown";
    const priority = responseText.match(/Priority:\s*(.+)/i)?.[1]?.trim() || "medium";
    const summary  = responseText.match(/Summary:\s*(.+)/i)?.[1]?.trim()  || "No summary";

    return { intent, priority, summary };

  } catch (error) {
    console.error("✗ Gemini Error:", error.message);

    // ✅ return safe fallback instead of crashing — workflow continues
    return {
      intent:   "unknown",
      priority: "medium",
      summary:  "AI analysis unavailable — please review manually",
    };
  }
};

module.exports = { analyzeText };