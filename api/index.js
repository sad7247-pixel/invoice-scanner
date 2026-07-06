const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// تفعيل CORS وحجم البيانات
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "لا توجد صورة مرسلة" });
    
    // استخراج بيانات الصورة
    const base64Data = image.split(',')[1] || image;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: "Extract details: id, customerName, customerPhone, customerAddress, orderDetails, customerNotes, orderPrice, deliveryPrice. Return JSON ONLY." }
        ]
      }]
    });

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("فشل تحويل رد Gemini إلى JSON");

    return res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (err) {
    return res.status(500).json({ error: "Server Error: " + err.message });
  }
});

// هذا هو الجزء الحيوي للـ Serverless
module.exports = serverless(app);
