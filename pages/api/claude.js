export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { system, userMessage } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API call failed" });
  }
}
