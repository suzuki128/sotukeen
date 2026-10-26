import express from "express";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(express.static("public")); // フロントのHTMLを置くフォルダ

// モデル名は変わることがあるので、公式ドキュメントで最新を確認してください
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

app.post("/api/menu", async (req, res) => {
  const { ingredients, people = 2, notes = "" } = req.body;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "食材を入力してください" });
  }

  const prompt = `
あなたは家庭料理の専門家です。冷蔵庫にある食材から献立を3つ提案してください。

# 食材
${ingredients.join("、")}

# 人数
${people}人分

# 要望・制約
${notes || "特になし"}

# ルール
- 基本は上の食材を使い、調味料や常備品(塩、醤油、油など)は使ってよい
- 足りない食材があれば missing に入れる
- 調理時間は30分以内を優先する

# 出力形式 (JSONのみ)
{
  "menus": [
    {
      "name": "料理名",
      "time_minutes": 20,
      "ingredients_used": ["食材1", "食材2"],
      "missing": ["足りない食材"],
      "steps": ["手順1", "手順2"]
    }
  ]
}
`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json", // JSONで返させる
          temperature: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ error: "AIの呼び出しに失敗しました" });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

app.listen(3000, () => console.log("http://localhost:3000"));