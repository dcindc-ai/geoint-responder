import { useState, useRef, useEffect } from "react";

const DEFAULT_QUESTION = `Hi folks!

I hope everyone is excited about the upcoming class this Monday. I wanted to kick off our first discussion with three questions. You can either answer before or after our first lecture.

I believe in goal setting, and because this class is about putting some foundations in place, we'll start there.

(1) What are your top two goals for this class?
(2) Why are you interested in GEOINT?
(3) What is the most interesting, recent application of GEOINT you have seen?

As I mentioned in the syllabus, there are no wrong answers here. I'm interested in what and how you think.`;

function buildSystemPrompt(sentenceCount, discussionQuestion) {
  const isFour = sentenceCount === 4;
  const questionPos = isFour ? "THIRD" : "FOURTH";
  const closePos = isFour ? "FOURTH" : "FIFTH";
  const countWord = isFour ? "FOUR" : "FIVE";
  const countLower = isFour ? "four" : "five";

  return `You are Dave Cook, a graduate-level instructor teaching Fundamentals of Geospatial Intelligence at the University of Maryland. You write like a senior professional who respects people's time. Your tone is warm but direct — conversational without being casual, professional without being corporate. There's a military/intelligence community influence in your cadence: clear, structured, no wasted words.

You are responding to a student's discussion post. Use the "Discussion Post / Participation Feedback" register — shorter, punchier, more conversational. Address the student directly with "you" and "I." Treat them like a colleague-in-training, not a child.

The discussion question you asked the class was:
---
${discussionQuestion}
---

When given a student's name and their discussion post, generate a response with EXACTLY these rules:

STRUCTURE (follow this feedback formula):
1. Exactly ${countWord} sentences. No more, no fewer.
2. Each sentence must be no more than 15 words.
3. Lead with a specific strength — name what worked and why. Not generic praise.
4. The ${questionPos} sentence must be a question that prompts deeper thinking — sparked by something specific they wrote. Use patterns like "What happens when..." or "Ask yourself — so what?"
5. The ${closePos} sentence must end with forward momentum. Use patterns like "Keep pushing on this." "You're on the right track." "Start there."

VOICE:
6. Use contractions by default (I'm, it's, don't, can't). Switch to "I am" or "I do" only when the sentence carries weight or genuine conviction.
7. Use dashes for asides and pivots — this is a key marker of your voice.
8. Never use exclamation marks. No "Great job!" or "Wow!" If something is genuinely impressive, say so plainly: "This is strong work."
9. Use the student's first name EXACTLY ONCE, naturally, not forced.

NEVER DO THIS:
10. Never say "Overall," "demonstrates proficiency," "showcases understanding," "effectively utilizes," or "great job."
11. Never sound like a rubric, a government memo, a LinkedIn influencer, or a corporate template.
12. Never use generic praise. "This is good" is not feedback. Name the specific thing that worked.

Return ONLY the ${countLower} sentences, no preamble, no labels, no extra text.`;
}

function buildSummaryPrompt(discussionQuestion) {
  return `You are Dave Cook, a graduate-level instructor teaching Fundamentals of Geospatial Intelligence at the University of Maryland. You've collected discussion post responses from your students and you're writing a class summary to share back with them.

The discussion question was:
---
${discussionQuestion}
---

Write a summary that sounds like you'd actually say it to the class. Your voice is warm but direct — conversational without being casual, professional without being corporate. Short sentences. If a sentence has more than one comma, split it.

The summary should:
1. Lead with what worked — name the specific themes and strengths you saw across the responses. Be specific, not generic.
2. Call out 2-3 of the most compelling or creative ideas students mentioned. Name the student and what they said.
3. Use a question to push the class's thinking further — "What happens when..." or "Ask yourself — so what?"
4. End with forward momentum. "Keep pushing on this." "You're on the right track." Not saccharine encouragement.

VOICE RULES:
- Use "you" and "I" throughout. Address the class directly.
- Use contractions by default. Switch to "I am" or "I do" only for emphasis or conviction.
- Use dashes for asides and pivots — this is a key marker of your voice.
- Use "So," to pivot to the main point when appropriate.
- Never use exclamation marks, bullet points, or rubric language.
- Never say "Overall," "demonstrates proficiency," "showcases understanding," "great job," or "in conclusion."
- Never sound like a government memo, a LinkedIn influencer, or a corporate template.
- Preferred phrases: "This is strong work." "What would strengthen this is..." "The question you need to answer is..." "Go deeper here."

Write in flowing paragraphs. Keep it under 200 words.`;
}

export default function GeointResponder() {
  const [discussionQuestion, setDiscussionQuestion] = useState(DEFAULT_QUESTION);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [view, setView] = useState("responder");
  const responseRef = useRef(null);

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [response]);

  async function callClaude(system, userMessage) {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, userMessage })
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text || "";
  }

  async function generateResponse() {
    if (!name.trim() || !answer.trim()) return;
    setLoading(true);
    setResponse("");
    setError("");
    setCopied(false);
    const sentenceCount = Math.random() < 0.5 ? 4 : 5;
    try {
      const text = await callClaude(
        buildSystemPrompt(sentenceCount, discussionQuestion),
        `Student name: ${name}\n\nStudent's answer:\n${answer}`
      );
      setResponse(text.trim());
      setSubmissions(prev => [...prev, { name: name.trim(), answer: answer.trim() }]);
    } catch (e) {
      setError(`Error: ${e.message}. Check that your ANTHROPIC_API_KEY is set in Vercel.`);
    }
    setLoading(false);
  }

  async function generateSummary() {
    if (submissions.length < 2) return;
    setSummaryLoading(true);
    setSummary("");
    const allResponses = submissions.map((s, i) =>
      `Student ${i + 1} (${s.name}):\n${s.answer}`
    ).join("\n\n---\n\n");
    try {
      const text = await callClaude(
        buildSummaryPrompt(discussionQuestion),
        `Here are the student responses:\n\n${allResponses}`
      );
      setSummary(text.trim());
    } catch (e) {
      setSummary(`Error: ${e.message}`);
    }
    setSummaryLoading(false);
  }

  function copyResponse() {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copySummary() {
    navigator.clipboard.writeText(summary);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  }

  function handleNewDiscussion() {
    setDiscussionQuestion("");
    setSubmissions([]);
    setSummary("");
    setResponse("");
    setError("");
    setName("");
    setAnswer("");
    setEditingQuestion(true);
    setView("responder");
  }

  // UMD colors
  const red = "#E21833";
  const redDark = "#b8001f";
  const redFaint = "rgba(226,24,51,0.15)";
  const redBorder = "rgba(226,24,51,0.35)";

  const inputStyle = {
    width: "100%",
    background: "#fff",
    border: "1.5px solid #ddd",
    borderRadius: "6px",
    padding: "12px 16px",
    color: "#1a1a1a",
    fontSize: "15px",
    fontFamily: "Georgia, serif",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: "1.6"
  };

  const labelStyle = {
    display: "block",
    color: red,
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    marginBottom: "8px",
    fontWeight: "600"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "48px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px", maxWidth: "640px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: red, textTransform: "uppercase", marginBottom: "10px", fontWeight: "600" }}>
          University of Maryland · Graduate Studies
        </div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", color: "#1a1a1a", fontWeight: "700", margin: "0 0 8px", lineHeight: "1.2" }}>
          GEOINT Discussion Responder
        </h1>
        <p style={{ color: "#666", fontSize: "15px", margin: 0, fontStyle: "italic" }}>
          Fundamentals of Geospatial Intelligence
        </p>
        <div style={{ width: "60px", height: "3px", background: red, margin: "16px auto 0" }} />
      </div>

      {/* Discussion Question Block */}
      <div style={{
        background: "#fff",
        border: `1.5px solid ${redBorder}`,
        borderRadius: "12px",
        padding: "24px 28px",
        width: "100%",
        maxWidth: "640px",
        boxSizing: "border-box",
        marginBottom: "20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: red, textTransform: "uppercase", fontWeight: "600" }}>
            Discussion Question
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[["Edit/Done", editingQuestion ? "Done" : "Edit", () => setEditingQuestion(!editingQuestion)],
              ["New", "New Discussion", handleNewDiscussion]].map(([key, label, fn]) => (
              <button key={key} onClick={fn} style={{
                background: "transparent",
                border: `1.5px solid ${redBorder}`,
                borderRadius: "4px", padding: "5px 12px", color: red,
                fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: "600"
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {editingQuestion ? (
          <textarea
            value={discussionQuestion}
            onChange={e => setDiscussionQuestion(e.target.value)}
            rows={6}
            placeholder="Paste your discussion question here..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        ) : (
          <p style={{
            color: "#444", fontSize: "14px", lineHeight: "1.7", margin: 0,
            whiteSpace: "pre-wrap", fontStyle: "italic", maxHeight: "120px",
            overflow: "hidden",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)"
          }}>
            {discussionQuestion || "No question set. Click Edit to add one."}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", width: "100%", maxWidth: "640px" }}>
        {["responder", "summary"].map(tab => (
          <button key={tab} onClick={() => setView(tab)} style={{
            flex: 1, padding: "11px",
            background: view === tab ? red : "#fff",
            border: `1.5px solid ${view === tab ? red : "#ddd"}`,
            borderRadius: "6px",
            color: view === tab ? "#fff" : "#666",
            fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
            fontFamily: "Georgia, serif", fontWeight: "700",
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>
            {tab === "responder" ? "Respond to Student" : `Class Summary${submissions.length > 0 ? ` (${submissions.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Responder View */}
      {view === "responder" && (
        <>
          <div style={{
            background: "#fff", border: "1.5px solid #e0e0e0",
            borderRadius: "12px", padding: "36px", width: "100%", maxWidth: "640px",
            boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
          }}>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Student Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="First and last name"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "28px" }}>
              <label style={labelStyle}>Student's Response</label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Paste the student's discussion post here..."
                rows={7}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <button
              onClick={generateResponse}
              disabled={loading || !name.trim() || !answer.trim() || !discussionQuestion.trim()}
              style={{
                width: "100%", padding: "14px",
                background: loading || !name.trim() || !answer.trim() ? "#ccc" : red,
                border: "none", borderRadius: "6px",
                color: "#fff",
                fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", fontWeight: "700",
                cursor: loading || !name.trim() || !answer.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Generating Response…" : "Generate Response"}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: "20px", background: "#fff0f0", border: `1.5px solid ${red}`,
              borderRadius: "8px", padding: "16px 20px", width: "100%", maxWidth: "640px",
              boxSizing: "border-box", color: redDark, fontSize: "14px"
            }}>
              {error}
            </div>
          )}

          {response && (
            <div ref={responseRef} style={{
              marginTop: "28px", background: "#fff",
              border: `2px solid ${red}`,
              borderRadius: "12px", padding: "32px 36px", width: "100%", maxWidth: "640px",
              boxSizing: "border-box", boxShadow: "0 4px 20px rgba(226,24,51,0.1)"
            }}>
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: red, textTransform: "uppercase", marginBottom: "16px", fontWeight: "600" }}>
                Suggested Response
              </div>
              <p style={{ color: "#222", fontSize: "17px", lineHeight: "1.85", margin: "0 0 24px", fontStyle: "italic" }}>
                {response}
              </p>
              <button onClick={copyResponse} style={{
                background: copied ? red : "transparent",
                border: `1.5px solid ${red}`,
                borderRadius: "4px", padding: "8px 18px",
                color: copied ? "#fff" : red,
                fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: "600",
                transition: "all 0.2s"
              }}>
                {copied ? "✓ Copied" : "Copy to Clipboard"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Summary View */}
      {view === "summary" && (
        <div style={{
          background: "#fff", border: "1.5px solid #e0e0e0",
          borderRadius: "12px", padding: "36px", width: "100%", maxWidth: "640px",
          boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
        }}>
          {submissions.length < 2 ? (
            <p style={{ color: "#888", fontStyle: "italic", textAlign: "center", margin: 0 }}>
              {submissions.length === 0
                ? "No responses logged yet. Generate at least two replies to enable the class summary."
                : "One response logged. Add at least one more to generate a summary."}
            </p>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <div style={labelStyle}>Responses Logged</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {submissions.map((s, i) => (
                    <span key={i} style={{
                      background: redFaint, border: `1px solid ${redBorder}`,
                      borderRadius: "20px", padding: "4px 14px", color: redDark, fontSize: "13px", fontWeight: "600"
                    }}>{s.name}</span>
                  ))}
                </div>
              </div>
              <button onClick={generateSummary} disabled={summaryLoading} style={{
                width: "100%", padding: "14px",
                background: summaryLoading ? "#ccc" : red,
                border: "none", borderRadius: "6px", color: "#fff",
                fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", fontWeight: "700", cursor: summaryLoading ? "not-allowed" : "pointer",
                marginBottom: summary ? "28px" : "0"
              }}>
                {summaryLoading ? "Generating Summary…" : "Generate Class Summary"}
              </button>
              {summary && (
                <>
                  <div style={{ ...labelStyle, marginTop: "8px" }}>Class Highlights</div>
                  <p style={{ color: "#222", fontSize: "16px", lineHeight: "1.9", margin: "0 0 24px" }}>
                    {summary}
                  </p>
                  <button onClick={copySummary} style={{
                    background: summaryCopied ? red : "transparent",
                    border: `1.5px solid ${red}`,
                    borderRadius: "4px", padding: "8px 18px",
                    color: summaryCopied ? "#fff" : red,
                    fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
                    fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: "600", transition: "all 0.2s"
                  }}>
                    {summaryCopied ? "✓ Copied" : "Copy to Clipboard"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::placeholder { color: #aaa; }
        button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
