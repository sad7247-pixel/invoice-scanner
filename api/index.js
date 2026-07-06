دconst express = require("express");
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

app.post("/api", async (req, res) => {
  try {
    console.log("1. الطلب وصل بنجاح");
    
    // فحص المفتاح
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY غير موجود في الإعدادات!");
    console.log("2. المفتاح موجود");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("3. تم إنشاء نموذج Gemini");

    const { image } = req.body;
    if (!image) throw new Error("لم يتم إرسال أي صورة");
    console.log("4. الصورة موجودة");
    
    const base64Data = image.split(',')[1] || image;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: "Extract details: id, customerName, customerPhone, customerAddress, orderDetails, customerNotes, orderPrice, deliveryPrice. Return JSON ONLY." }
        ]
      }]
    });

    console.log("5. تم استلام الرد من Gemini");
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("فشل في استخراج JSON من رد النموذج");

    res.json(JSON.parse(jsonMatch[0]));

  } catch (err) {
    console.error("خطأ حرج:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
