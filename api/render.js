module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-plugin-version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY 未設定' });

  const { scene, image, prompt, style } = req.body;
  if (!image) return res.status(400).json({ error: '缺少截圖資料' });

  try {
    const styleDesc    = style?.style    || 'modern minimalist interior design';
    const materialDesc = style?.material ? `Flooring and primary material: ${style.material}.` : '';
    const lightDesc    = style?.light    || 'bright natural daylight';
    const extraDesc    = prompt          ? `Additional requirements: ${prompt}.` : '';

    const renderPrompt = `Transform this SketchUp 3D architectural model screenshot into a photorealistic interior design render.\n\nSTYLE: ${styleDesc}\n${materialDesc}\nLIGHTING: ${lightDesc}\n${extraDesc}\n\nCRITICAL REQUIREMENTS:\n- Preserve EXACT room layout, dimensions, wall positions, window locations, and furniture placement from the original model\n- Replace all SketchUp geometry with photorealistic real-world materials, textures, and finishes\n- Apply professional architectural photography lighting with natural shadows and reflections\n- Output must look like a high-end interior design magazine photograph\n- Remove ALL SketchUp construction lines, wireframes, and 3D model artifacts\n- Add realistic details: plants, decorative objects, books, cushions appropriate to the style\n- Show realistic sky/exterior through windows that matches the lighting condition\n- Camera angle and perspective must match the original screenshot exactly`;

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: renderPrompt }
          ]
        }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      try {
        const errJson = JSON.parse(errText);
        return res.status(502).json({ error: `AI 引擎錯誤: ${errJson.error?.message || errText}` });
      } catch {
        return res.status(502).json({ error: `AI 引擎回應異常 (${geminiResponse.status})` });
      }
    }

    const geminiData = await geminiResponse.json();
    const parts = geminiData?.candidates?.[0]?.content?.parts || [];
    let imageData = null;
    let mimeType  = 'image/jpeg';

    for (const part of parts) {
      if (part.inlineData?.data) {
        imageData = part.inlineData.data;
        mimeType  = part.inlineData.mimeType || 'image/jpeg';
        break;
      }
    }

    if (!imageData) {
      console.error('No image in response:', JSON.stringify(geminiData).slice(0, 500));
      return res.status(500).json({ error: 'AI 未回傳圖片，請重試' });
    }

    return res.status(200).json({
      imageData:  imageData,
      mimeType:   mimeType,
      promptUsed: renderPrompt.slice(0, 200) + '...'
    });

  } catch (err) {
    console.error('Render handler error:', err);
    return res.status(500).json({ error: err.message || '伺服器內部錯誤' });
  }
};
