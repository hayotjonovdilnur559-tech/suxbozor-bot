const TOKEN = "8994677057:AAEs0xlP6EdSL638le8pJUhouzPwsxWwTLE";
const ADMIN_ID = null;

let products = [];
let userStates = {};
let pendingProducts = {};

async function sendMessage(chatId, text, keyboard = null) {
  const body = { chat_id: chatId, text: text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = keyboard;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

async function forwardToAdmin(text, keyboard = null) {
  if (!ADMIN_ID) return;
  await sendMessage(ADMIN_ID, text, keyboard);
}

const mainKeyboard = {
  keyboard: [["🛍️ Mahsulotlar", "➕ Buyum joylash"], ["📞 Aloqa", "ℹ️ Haqida"]],
  resize_keyboard: true,
};
const cancelKeyboard = { keyboard: [["❌ Bekor qilish"]], resize_keyboard: true };
const categoryKeyboard = {
  keyboard: [["📱 Telefon", "⌚ Soat"], ["🏠 Maishiy", "🎧 Audio"], ["💻 Kompyuter", "🎁 Boshqa"], ["❌ Bekor qilish"]],
  resize_keyboard: true,
};

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = msg.from.id;
  const userName = msg.from.first_name || "Foydalanuvchi";
  const state = userStates[userId];

  if (text === "/start") {
    userStates[userId] = null;
    await sendMessage(chatId, `🎉 <b>SuxBozor</b>ga xush kelibsiz, ${userName}!\n\nBu yerda siz:\n✅ Mahsulot sotib olishingiz\n✅ O'z buyumingizni sotishingiz mumkin!\n\nQuyidagi tugmalardan birini tanlang 👇`, mainKeyboard);
    return;
  }

  if (text === "❌ Bekor qilish") {
    userStates[userId] = null;
    await sendMessage(chatId, "✅ Bekor qilindi.", mainKeyboard);
    return;
  }

  if (text === "🛍️ Mahsulotlar") {
    if (products.length === 0) {
      await sendMessage(chatId, "📭 Hozircha mahsulot yo'q.\n\n➕ Birinchi bo'lib buyum joylang!", mainKeyboard);
      return;
    }
    await sendMessage(chatId, `📦 <b>Barcha mahsulotlar (${products.length} ta):</b>`, mainKeyboard);
    for (const p of products) {
      const txt = `${p.emoji} <b>${p.name}</b>\n💰 Narx: <b>${Number(p.price).toLocaleString()} so'm</b>\n📁 ${p.category}\n📝 ${p.desc}\n👤 Sotuvchi: ${p.seller}\n📞 Tel: ${p.phone}`;
      const kb = p.sellerUsername ? { inline_keyboard: [[{ text: "📞 Sotuvchi bilan bog'lanish", url: `https://t.me/${p.sellerUsername}` }]] } : null;
      await sendMessage(chatId, txt, kb);
    }
    return;
  }

  if (text === "➕ Buyum joylash") {
    userStates[userId] = { step: "name" };
    pendingProducts[userId] = {};
    await sendMessage(chatId, "➕ <b>Yangi mahsulot joylash</b>\n\n1️⃣ Mahsulot nomini yozing:\n<i>Masalan: Samsung Galaxy A55</i>", cancelKeyboard);
    return;
  }

  if (text === "📞 Aloqa") {
    await sendMessage(chatId, "📞 <b>Biz bilan bog'laning:</b>\n\n📱 Telegram: @SuxBozorBot\n🌐 Sayt: suxbozor.netlify.app\n\nSavol va takliflar uchun yozing!", mainKeyboard);
    return;
  }

  if (text === "ℹ️ Haqida") {
    await sendMessage(chatId, "ℹ️ <b>SuxBozor haqida</b>\n\n🛍️ O'zbek onlayn bozori\n✅ Bepul joylash\n✅ Tez va qulay\n✅ Minglab xaridor\n\n🚀 Hoziroq sotishni boshlang!", mainKeyboard);
    return;
  }

  if (state) {
    const p = pendingProducts[userId];
    if (state.step === "name") {
      p.name = text; userStates[userId] = { step: "category" };
      await sendMessage(chatId, "2️⃣ Kategoriyani tanlang:", categoryKeyboard);
      return;
    }
    if (state.step === "category") {
      const cats = ["📱 Telefon", "⌚ Soat", "🏠 Maishiy", "🎧 Audio", "💻 Kompyuter", "🎁 Boshqa"];
      if (!cats.includes(text)) { await sendMessage(chatId, "⚠️ Iltimos, tugmadan kategoriya tanlang!", categoryKeyboard); return; }
      p.category = text; p.emoji = text.split(" ")[0]; userStates[userId] = { step: "price" };
      await sendMessage(chatId, "3️⃣ Narxni yozing (so'mda):\n<i>Masalan: 500000</i>", cancelKeyboard);
      return;
    }
    if (state.step === "price") {
      if (isNaN(text) || Number(text) <= 0) { await sendMessage(chatId, "⚠️ Faqat raqam kiriting:", cancelKeyboard); return; }
      p.price = Number(text); userStates[userId] = { step: "desc" };
      await sendMessage(chatId, "4️⃣ Mahsulot haqida qisqacha yozing:", cancelKeyboard);
      return;
    }
    if (state.step === "desc") {
      p.desc = text; userStates[userId] = { step: "seller" };
      await sendMessage(chatId, "5️⃣ Ismingiz yoki do'kon nomingiz:", cancelKeyboard);
      return;
    }
    if (state.step === "seller") {
      p.seller = text; p.sellerUsername = msg.from.username || ""; userStates[userId] = { step: "phone" };
      await sendMessage(chatId, "6️⃣ Telefon raqamingiz:\n<i>Masalan: +998901234567</i>", cancelKeyboard);
      return;
    }
    if (state.step === "phone") {
      p.phone = text; p.id = Date.now(); p.date = new Date().toLocaleDateString("uz-UZ");
      products.push({ ...p });
      await sendMessage(chatId, `✅ <b>Mahsulotingiz joylandi!</b>\n\n${p.emoji} <b>${p.name}</b>\n💰 ${Number(p.price).toLocaleString()} so'm\n\n🛍️ Mahsulotlar bo'limida ko'rishingiz mumkin!`, mainKeyboard);
      userStates[userId] = null; pendingProducts[userId] = null;
      return;
    }
  }

  await sendMessage(chatId, "👇 Quyidagi tugmalardan birini tanlang:", mainKeyboard);
}

async function handleCallback(query) {
  const data = query.data;
  if (data.startsWith("approve_")) {
    const parts = data.split("_");
    const p = pendingProducts[`pending_${parts[1]}`];
    if (p) { products.push(p); delete pendingProducts[`pending_${parts[1]}`]; await sendMessage(parts[2], `🎉 Mahsulotingiz tasdiqlandi!`, mainKeyboard); }
  }
}

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    if (req.method === "POST") {
      const update = await req.json();
      if (update.message) await handleMessage(update.message);
      if (update.callback_query) await handleCallback(update.callback_query);
      return new Response("OK");
    }
    return new Response("SuxBozor Bot ishlayapti! 🚀");
  },
});

console.log(`✅ SuxBozor Bot ishga tushdi! Port: ${server.port}`);
                                                    
