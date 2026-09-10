
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Divar File Bot is running");
  }

  try {
    const update = req.body;

    if (!update?.message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    if (text === "/start") {
      await sendTelegram(chatId,
        "سلام 👋\n\nلینک آگهی دیوار را برای من بفرست تا اطلاعات قابل‌دسترسی آگهی را مرتب کنم."
      );
      return res.status(200).json({ ok: true });
    }

    if (!text.includes("divar.ir")) {
      await sendTelegram(chatId,
        "لطفاً لینک آگهی دیوار را ارسال کن."
      );
      return res.status(200).json({ ok: true });
    }

    await sendTelegram(chatId, "⏳ در حال بررسی آگهی...");

    const response = await fetch(text, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      }
    });

    const html = await response.text();

    const cleanText = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();

    const phoneMatches = cleanText.match(
      /(?:09|\+989)\d{9}/g
    ) || [];

    const phone = [...new Set(phoneMatches)].join("\n") || "نمایش داده نشده";

    const titleMatch = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i
    );

    const descriptionMatch = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i
    );

    const title = titleMatch
      ? titleMatch[1]
      : "عنوان پیدا نشد";

    const description = descriptionMatch
      ? descriptionMatch[1]
      : "توضیحات پیدا نشد";

    const result =
`🏠 اطلاعات آگهی دیوار

📌 عنوان:
${title}

📞 شماره تماس:
${phone}

📍 لوکیشن:
در صورت نمایش در صفحه آگهی استخراج می‌شود.

💰 قیمت / رهن / اجاره:
از متن آگهی استخراج می‌شود.

📐 متراژ / اتاق / طبقه:
از متن آگهی استخراج می‌شود.

🚗 پارکینگ:
از متن آگهی استخراج می‌شود.

🛗 آسانسور:
از متن آگهی استخراج می‌شود.

📦 انباری:
از متن آگهی استخراج می‌شود.

📝 توضیحات:
${description}

🔗 لینک آگهی:
${text}`;

    await sendTelegram(chatId, result);

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);

    return res.status(200).json({
      ok: false,
      error: "خطا در پردازش آگهی"
    });
  }
}

async function sendTelegram(chatId, message) {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error("BOT_TOKEN is not configured");
  }

  await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    }
  );
}
