const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json({ limit: '10mb' }));

// هذا المعالج هو الحل لمشكلة الـ CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api", async (req, res) => {
  try {
    const { image } = req.body;
    let mimeType = "image/jpeg";
    let base64Data = image;
    
    if (image && image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: "Extract details: id, customerName, customerPhone, customerAddress, orderDetails, customerNotes, orderPrice, deliveryPrice. Return JSON ONLY." }
        ]
      }]
    });

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleanJson));

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "خطأ في الاتصال بـ Gemini: " + err.message });
  }
});

module.exports = app
