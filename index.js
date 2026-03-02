const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/wechat', async (req, res) => {
  const msg = req.body;
  console.log('收到微信消息:', msg);

  const userMessage = msg.Content || "你好";

  let aiReply = "出错了";

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "你是一个理性冷静的工具型AI助手。" },
          { role: "user", content: userMessage }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    aiReply = response.data.choices[0].message.content;

  } catch (err) {
    console.error(err.response?.data || err.message);
    aiReply = "AI调用失败";
  }

  const reply = {
    ToUserName: msg.FromUserName,
    FromUserName: msg.ToUserName,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: "text",
    Content: aiReply
  };

  res.json(reply);
});

app.get('/', (req, res) => {
  res.send('server running');
});

app.listen(3000, () => {
  console.log('server running');
});
