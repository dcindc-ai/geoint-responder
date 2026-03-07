import { useState } from "react";

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

  return `You are a graduate-level instructor teaching Fundamentals of Geospatial Intelligence at the University of Maryland. Your voice is casual, direct, warm, and real, not stiff or academic. You sound like a sharp mentor who genuinely enjoys their students: conversational, encouraging, occasionally playful, and always specific. You use plain language and keep it tight.

The discussion question you asked the class was:
---
${discussionQuestion}
---

When given a student's name and their discussion post, generate a response with EXACTLY these rules:
1. Exactly ${countWord} sentences. No more, no fewer.
2. Each sentence must be no more than 15 words.
3. The ${questionPos} sentence must be a question, something genuinely curious, sparked by their answer.
4. The ${closePos} sentence must close warmly, commending the student for a thoughtful response.
5. Sound like a real person: use casual openers, contractions, and plain English. Avoid formal or flowery language.
6. Never use em dashes anywhere in the response. Use commas, periods, or conjunctions instead.
7. Use the student's first name EXACTLY ONCE, naturally, not forced.
8. Engage specifically with what they actually wrote, no generic praise.

Return ONLY the ${countLower} sentences, no preamble, no labels, no extra text.`;
}

function buildSummaryPrompt(discussionQuestion) {
  return `You are a graduate-level instructor teaching Fundamentals of Geospatial Intelligence at the University of Maryland. You have collected discussion post responses from your students.

The discussion question was:
---
${discussionQuestion}
---

Analyze all the student responses and write a warm, engaging class summary that:
1. Highlights the most common themes and goals across students
2. Notes interesting patterns in how students approached the question
3. Calls out 2-3 of the most compelling or creative ideas students mentioned
4. Ends with an encouraging note about the class as a whole

Write in a casual, direct, mentor tone. Plain English, no jargon, no bullet points. Use flowing paragraphs. Keep it under 200 words. This summary will be shared back with the students.`;
}

export default function GeointResponder() {
  const [discussionQuestion, setDiscussionQuestion] = useState(DEFAULT_QUESTION);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [view, setView] = useState("responder");

  async function callClaude(system, userMessage) {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, userMessage })
    });
    const data = await res.json();
    return data.text || "";
  }

  async function generateResponse() {
    if (!name.trim() || !answer.trim()) return;
    setLoading(true);
    setResponse("");
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
      setResponse("Something went wrong. Please try again.");
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
      setView("summary");
    } catch (e) {
      setSummary("Something went wrong. Please try again.");
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
    setName("");
    setAnswer("");
    setEditingQuestion(true);
    setView("responder");
  }

  const gold = "#b8860b";
  const goldFaint = "rgba(184,134,11,0.25)";
  const cream = "#f0e6cc";
  const slate = "#8a9bb5";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #0d1f35 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "48px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{ textAlign: "center", marginBottom: "28px", maxWidth: "640px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: gold, textTransform: "uppercase", marginBottom: "12px" }}>
          University of Maryland · Graduate Studies
        </div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", color: cream, fontWeight: "400", margin: "0 0 8px", lineHeight: "1.2" }}>
          GEOINT Discussion Responder
        </h1>
        <p style={{ color: slate, fontSize: "15px", margin: 0, fontStyle: "italic" }}>
          Fundamentals of Geospatial Intelligence
        </p>
      </div>

      {/* Discussion Question Block */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: `1px solid ${goldFaint}`,
        borderRadius: "12px", padding: "24px 28px", width: "100%",
        maxWidth: "640px", boxSizing: "border-box", marginBottom: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: gold, textTransform: "uppercase" }}>
            Discussion Question
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setEditingQuestion(!editingQuestion)} style={{
              background: "transparent", border: `1px solid rgba(184,134,11,0.4)`,
              borderRadius: "4px", padding: "5px 12px", color: gold,
              fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase",
              fontFamily: "Georgia, serif", cursor: "pointer"
            }}>
              {editingQuestion ? "Done" : "Edit"}
            </button>
            <button onClick={handleNewDiscussion} style={{
              background: "transparent", border: `1px solid rgba(184,134,11,0.4)`,
              borderRadius: "4px", padding: "5px 12px", color: gold,
              fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase",
              fontFamily: "Georgia, serif", cursor: "pointer"
            }}>
              New Discussion
            </button>
          </div>
        </div>
        {editingQuestion ? (
          <textarea
            value={discussionQuestion}
            onChange={e => setDiscussionQuestion(e.target.value)}
            rows={6}
            placeholder="Paste your discussion question here..."
            style={{
              width: "100%", background: "rgba(255,255,255,0.06)",
              border: `1px solid rgba(184,134,11,0.35)`, borderRadius: "6px",
              padding: "12px 14px", color: cream, fontSize: "14px",
              fontFamily: "Georgia, serif", outline: "none", resize: "vertical",
              boxSizing: "border-box", lineHeight: "1.65"
            }}
          />
        ) : (
          <p style={{
            color: "#c8b98a", fontSize: "14px", lineHeight: "1.7", margin: 0,
            whiteSpace: "pre-wrap", fontStyle: "italic", maxHeight: "120px",
            overflow: "hidden", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)"
          }}>
            {discussionQuestion || "No question set. Click Edit to add one."}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", width: "100%", maxWidth: "640px" }}>
        {["responder", "summary"].map(tab => (
          <button key={tab} onClick={() => setView(tab)} style={{
            flex: 1, padding: "10px",
            background: view === tab ? `linear-gradient(135deg, ${gold}, #d4a017)` : "rgba(255,255,255,0.04)",
            border: `1px solid ${view === tab ? gold : goldFaint}`,
            borderRadius: "6px", color: view === tab ? "#0a1628" : slate,
            fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
            fontFamily: "Georgia, serif", fontWeight: view === tab ? "700" : "400",
            cursor: "pointer", transition: "all 0.2s"
          }}>
            {tab === "responder" ? "Respond to Student" : `Class Summary${submissions.length > 0 ? ` (${submissions.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Responder View */}
      {view === "responder" && (
        <>
          <div style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${goldFaint}`,
            borderRadius: "12px", padding: "36px", width: "100%", maxWidth: "640px",
            backdropFilter: "blur(10px)", boxSizing: "border-box"
          }}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: gold, fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>
                Student Name
              </label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="First and last name"
                style={{
                  width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(184,134,11,0.3)",
                  borderRadius: "6px", padding: "12px 16px", color: cream, fontSize: "16px",
                  fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", color: gold, fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>
                Student's Response
              </label>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                placeholder="Paste the student's discussion post here..." rows={7}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(184,134,11,0.3)",
                  borderRadius: "6px", padding: "14px 16px", color: cream, fontSize: "15px",
                  fontFamily: "Georgia, serif", outline: "none", resize: "vertical",
                  boxSizing: "border-box", lineHeight: "1.6"
                }}
              />
            </div>
            <button onClick={generateResponse}
              disabled={loading || !name.trim() || !answer.trim() || !discussionQuestion.trim()}
              style={{
                width: "100%", padding: "14px",
                background: loading || !name.trim() || !answer.trim() || !discussionQuestion.trim()
                  ? "rgba(184,134,11,0.2)" : `linear-gradient(135deg, ${gold}, #d4a017)`,
                border: "none", borderRadius: "6px",
                color: loading || !name.trim() || !answer.trim() ? "#6b7a8d" : "#0a1628",
                fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
              }}>
              {loading ? "Generating Response…" : "Generate Response"}
            </button>
          </div>

          {response && (
            <div style={{
              marginTop: "28px", background: "rgba(184,134,11,0.07)", border: "1px solid rgba(184,134,11,0.35)",
              borderRadius: "12px", padding: "32px 36px", width: "100%", maxWidth: "640px",
              boxSizing: "border-box"
            }}>
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: gold, textTransform: "uppercase", marginBottom: "16px" }}>
                Suggested Response
              </div>
              <p style={{ color: "#e8d9b8", fontSize: "17px", lineHeight: "1.85", margin: "0 0 24px", fontStyle: "italic" }}>
                {response}
              </p>
              <button onClick={copyResponse} style={{
                background: "transparent", border: "1px solid rgba(184,134,11,0.5)",
                borderRadius: "4px", padding: "8px 18px", color: gold,
                fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", cursor: "pointer"
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
          background: "rgba(255,255,255,0.04)", border: `1px solid ${goldFaint}`,
          borderRadius: "12px", padding: "36px", width: "100%", maxWidth: "640px",
          backdropFilter: "blur(10px)", boxSizing: "border-box"
        }}>
          {submissions.length < 2 ? (
            <p style={{ color: slate, fontStyle: "italic", textAlign: "center", margin: 0 }}>
              {submissions.length === 0
                ? "No responses logged yet. Generate at least two replies to enable the class summary."
                : "One response logged. Add at least one more to generate a summary."}
            </p>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "3px", color: gold, textTransform: "uppercase", marginBottom: "12px" }}>
                  Responses Logged
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {submissions.map((s, i) => (
                    <span key={i} style={{
                      background: "rgba(184,134,11,0.12)", border: "1px solid rgba(184,134,11,0.3)",
                      borderRadius: "20px", padding: "4px 12px", color: "#e8d9b8", fontSize: "13px"
                    }}>{s.name}</span>
                  ))}
                </div>
              </div>
              <button onClick={generateSummary} disabled={summaryLoading} style={{
                width: "100%", padding: "14px",
                background: summaryLoading ? "rgba(184,134,11,0.2)" : `linear-gradient(135deg, ${gold}, #d4a017)`,
                border: "none", borderRadius: "6px",
                color: summaryLoading ? "#6b7a8d" : "#0a1628",
                fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "Georgia, serif", fontWeight: "600", cursor: "pointer",
                marginBottom: summary ? "28px" : "0"
              }}>
                {summaryLoading ? "Generating Summary…" : "Generate Class Summary"}
              </button>
              {summary && (
                <>
                  <div style={{ fontSize: "10px", letterSpacing: "3px", color: gold, textTransform: "uppercase", marginBottom: "16px" }}>
                    Class Highlights
                  </div>
                  <p style={{ color: "#e8d9b8", fontSize: "16px", lineHeight: "1.9", margin: "0 0 24px" }}>
                    {summary}
                  </p>
                  <button onClick={copySummary} style={{
                    background: "transparent", border: "1px solid rgba(184,134,11,0.5)",
                    borderRadius: "4px", padding: "8px 18px", color: gold,
                    fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
                    fontFamily: "Georgia, serif", cursor: "pointer"
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
        ::placeholder { color: rgba(138,155,181,0.5); }
      `}</style>
    </div>
  );
}
