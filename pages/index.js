import { useState, useRef, useEffect } from "react";

const DEFAULT_QUESTION = `Hi folks!

I hope everyone is excited about the upcoming class this Monday. I wanted to kick off our first discussion with three questions. You can either answer before or after our first lecture.

I believe in goal setting, and because this class is about putting some foundations in place, we'll start there.

(1) What are your top two goals for this class?
(2) Why are you interested in GEOINT?
(3) What is the most interesting, recent application of GEOINT you have seen?

As I mentioned in the syllabus, there are no wrong answers here. I'm interested in what and how you think.`;

function buildSystemPrompt(discussionQuestion) {
  return `You are Dave Cook, an instructor for Fundamentals of Geospatial Intelligence at the University of Maryland. You're replying to a student's discussion post.

Your voice: warm, direct, plain English. You talk to students like colleagues-in-training. You use contractions naturally. You keep sentences short. You don't gush or over-praise. You say what you mean.

The discussion question was:
---
${discussionQuestion}
---

Rules:
1. Write exactly FOUR sentences. No more, no fewer.
2. The first sentence must start with "Hey [first name]," and then reference something specific from their submission. Show that you read it.
3. The middle sentences should respond to their post with warm, genuine interest. You're a professor who cares about what they wrote.
4. One of the sentences (third or fourth) must be a question sparked by their answer.
5. Each sentence: 15 words max.
6. No exclamation marks. No em dashes. No "Overall." No "Great job." No rubric language.

Return ONLY the four sentences. Nothing else.`;
}

function buildSummaryPrompt(discussionQuestion) {
  return `You are Dave Cook, an instructor for Fundamentals of Geospatial Intelligence at the University of Maryland. You're writing a summary of student discussion posts to share back with the class.

Your voice: warm, direct, plain English. You talk to students like colleagues-in-training. Short sentences. No filler. You say what you mean.

The discussion question was:
---
${discussionQuestion}
---

Write 4-5 sentences in flowing paragraphs. Keep it under 200 words.
1. Name the common themes you saw across the responses. Be specific.
2. Call out 2-3 students by name and what they said that stood out.
3. Ask a question that pushes the class to think further.
4. Close with real encouragement. Not saccharine.

No exclamation marks. No em dashes. No bullet points. No "Overall." No "Great job." No rubric language. Just talk to them like people.`;
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
    try {
      const text = await callClaude(
        buildSystemPrompt(discussionQuestion),
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
