const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "لا توجد صورة" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] || image } },
          { text: "Extract details: id, customerName, customerPhone, customerAddress, orderDetails, customerNotes, orderPrice, deliveryPrice. Return JSON ONLY." }
        ]
      }]
    });

    const responseText = result.response.text();
    
    // الحل الجذري: تنظيف النص بحيث نحصل على الـ JSON فقط
    // هذا الكود يبحث عن أول { وآخر } ويستخرج ما بينهما
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("لم يرجع Gemini تنسيق JSON صالح");
    }

    const cleanJson = jsonMatch[0];
    res.json(JSON.parse(cleanJson));

  } catch (err) {
    console.error("خطأ:", err);
    res.status(500).json({ error: "خطأ في المعالجة: " + err.message });
  }
});

module.exports = app;
