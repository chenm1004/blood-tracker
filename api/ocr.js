export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { imageBase64, indicators } = req.body

    if (!imageBase64) return res.status(400).json({ error: '缺少图片数据' })
    if (!indicators?.length) return res.status(400).json({ error: '缺少指标列表' })

    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) return res.status(500).json({ error: '服务器未配置 DASHSCOPE_API_KEY' })

    // 动态构建指标列表
    const indicatorLines = indicators
      .map((ind, i) => {
        const short = ind.shortName ? `(${ind.shortName})` : ''
        return `${i + 1}. "${ind.name}"${short} — 单位: ${ind.unit}`
      })
      .join('\n')

    const prompt = `这是一张医院检验报告单的照片。请仔细阅读并提取以下检验指标的数值结果，以及报告上的检查日期。

需要提取的指标（请严格使用下方双引号内的名称作为返回 JSON 中 values 的 key）：
${indicatorLines}

请严格按以下 JSON 格式返回，不要添加任何其他文字、解释或 markdown 标记：
{
  "date": "YYYY-MM-DD格式的检查日期，找不到则为null",
  "values": {
    "指标名称": 数值,
    "指标名称": 数值
  }
}

重要规则：
1. values 中的 key 必须与上方双引号内的指标名称完全一致
2. 数值只填数字，不带单位，不带箭头符号
3. 报告中找不到的指标不要包含在 values 中
4. 只返回纯 JSON，不要返回任何其他内容`

    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('通义千问 API 错误:', errText)
      return res.status(500).json({ error: 'AI 接口调用失败' })
    }

    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || '{}'

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: '识别结果解析失败', raw: text })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return res.status(200).json({ success: true, data: parsed })
  } catch (error) {
    console.error('OCR 处理出错:', error)
    return res.status(500).json({ error: '识别服务出错：' + error.message })
  }
}