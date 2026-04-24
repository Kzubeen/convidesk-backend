const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = "convidesk123";
const WA_TOKEN = process.env.WA_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text.body.toLowerCase().trim();
      const reply = await getReply(from, text);
      await sendMessage(from, reply);
    }
  }
  res.sendStatus(200);
});

async function getReply(from, text) {
  try {
    // WhatsApp account dhundo number se
    const { data: waAccount } = await supabase
      .from('whatsapp_accounts')
      .select('user_id')
      .eq('phone_number', from)
      .single();

    let userId = waAccount?.user_id;

    // Agar nahi mila toh pehla business use karo (testing ke liye)
    if (!userId) {
      const { data: firstBusiness } = await supabase
        .from('businesses')
        .select('user_id')
        .limit(1)
        .single();
      userId = firstBusiness?.user_id;
    }

    if (!userId) {
      return "Shukriya message karne ke liye! Hum jald reply karenge.";
    }

    // Auto reply rules fetch karo
    const { data: rules } = await supabase
      .from('auto_reply_rules')
      .select('*')
      .eq('user_id', userId);

    if (!rules || rules.length === 0) {
      return "Shukriya! Hum jald reply karenge.";
    }

    // Matching rule dhundo
    for (const rule of rules) {
      const keywords = rule.trigger?.toLowerCase();
      if (keywords && text.includes(keywords)) {
        return rule.response;
      }
    }

    return "Shukriya message karne ke liye! Koi aur sawaal ho toh batayein.";

  } catch (err) {
    console.error('Supabase error:', err);
    return "Shukriya! Hum jald reply karenge.";
  }
}

async function sendMessage(to, message) {
  try {
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
  } catch (err) {
    console.error('WhatsApp send error:', err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
