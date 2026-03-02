const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 主页健康检查
app.get("/", (req, res) => {
  res.send("server running");
});

// 出网测试：百度
app.get("/nettest", async (req, res) => {
  try {
    const r = await axios.get("https://www.baidu.com", { timeout: 8000 });
    res.send("baidu ok " + r.status);
  } catch (e) {
    res.status(500).send("baidu fail " + (e.code || e.message));
  }
});

// 环境变量检查（不泄露 key，只看有没有配置）
app.get("/env", (req, res) => {
  res.json({
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
  });
});

// 出网测试：OpenAI（用于定位是网络问题还是 key 问题）
app.get("/nettest-openai", async (req, res) => {
  try {
    const r = await axios.get("https://api.openai.com/v1/models", {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    res.status(200).json({ ok: true, status: r.status });
  } catch (e) {
    res.status(500).json({
      ok: false,
      code: e.code,
      message: e.message,
      status: e.response?.status,
      data: e.response?.data,
    });
  }
});

// 微信回调（收到消息 -> 调 OpenAI -> 返回文本）
app.post("/wechat", async (req, res) => {
  const msg = req.body;
  console.log("收到微信消息:", msg);

  const userMessage = msg.Content || "你好";
  let aiReply = "出错了";

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "你是一个理性冷静的工具型AI助手。" },
          { role: "user", content: userMessage },
        ],
      },
      {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    aiReply = response.data.choices?.[0]?.message?.content ?? "空回复";
  } catch (err) {
    console.error("OpenAI error code:", err.code);
    console.error("OpenAI error message:", err.message);
    console.error("OpenAI error status:", err.response?.status);
    console.error("OpenAI error data:", err.response?.data);
    aiReply = `AI调用失败(${err.code || err.response?.status || "unknown"})`;
  }

  const reply = {
    ToUserName: msg.FromUserName,
    FromUserName: msg.ToUserName,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: "text",
    Content: aiReply,
  };

  res.json(reply);
});

app.listen(3000, () => {
  console.log("server running");
});
