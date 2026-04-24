const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = "convidesk123";
const WA_TOKEN = "EAANOVgh5TssBRR6ltLnDdqxbGQobm4P8ZClZCV0ofgOghwUidcVL4F0nLcHW4oH7Cmey9VZC1JpoorB2WXHOVeEXVC5ZBVqUILRmHmsxmZAw8wEuNlFZCzNe44gVNt6w3RzwMyv4JINOviyv4WyPSRHeDJNLZB2fROTqp27QMCpFlXd4UtTHdWwDKjWgfAADQ91amCZB4GIeKQZCQYOfK7nxZCP7rElhkp99muBqFBb1M6SOZC4fQZB9191nwAgPSZCfoDdROuidRL5ZBd1DZCMyd80R5wS";
const PHONE_NUMBER_ID = "950602574813735";

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    const message = body.entry?.[0]
      ?.changes?.[0]
      ?.value
      ?.messages?.[0];

    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text.body.toLowerCase();
      let reply = autoReply(text);
      await sendMessage(from, reply);
    }
  }

  res.sendStatus(200);
});

function autoReply(text) {
  if (text.includes('price') || text.includes('rate') || text.includes('kitna')) {
    return "Hamare products ki price list:\n- Product A: ₹100\n- Product B: ₹200";
  }
  if (text.includes('stock') || text.includes('available')) {
    return "Haan, stock available hai. Order ke liye batayein.";
  }
  if (text.includes('time') || text.includes('timing') || text.includes('open')) {
    return "Hum Monday-Saturday, 9AM-7PM open hain.";
  }
  if (text.includes('location') || text.includes('address') || text.includes('kahan')) {
    return "Hamara address: gwaltoli";
  }
  return "Shukriya! Hum jald reply karenge.";
}

async function sendMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
