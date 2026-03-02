const express = require('express');
const app = express();

app.use(express.json());

// 微信消息接口
app.post('/wechat', (req, res) => {
  const msg = req.body;

  console.log('收到微信消息:', msg);

  const reply = {
    ToUserName: msg.FromUserName,
    FromUserName: msg.ToUserName,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: "text",
    Content: "收到你的消息：" + (msg.Content || "你好")
  };

  res.json(reply);
});

// 测试接口
app.get('/', (req, res) => {
  res.send("server running");
});

app.listen(3000, () => {
  console.log('server running');
});
