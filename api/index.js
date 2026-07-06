const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // السماح لموقعك بالاتصال
  
  try {
    const { image } = req.body;
    
    // معالجة البيانات
    let mimeType = "image/jpeg";
    let base64Data = image;
    if (image.startsWith("data:")) {
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
    res.status(500).json({ error: "خطأ في الاتصال بـ Gemini: " + err.message });
  }
});

// هذا هو الجزء الذي يجعله يعمل على Vercel
module.exports = app;
