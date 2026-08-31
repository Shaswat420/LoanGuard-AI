import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
  KeyboardEvent,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "./Copilot.css";

const API_URL = "https://loanguard-ai-2y9l.onrender.com/api";

/* =========================================================
   TYPES
========================================================= */

type Loan = {
  id: number;
  loanNumber: string;
  borrowerName: string;

  originalLoanAmount: number;
  currentBalance: number | null;
  interestRate: number | null;
  loanTermMonths: number | null;

  loanStatus: string;

  originationDate: string;
  maturityDate: string;

  dataSource: string;

  validationErrorCount: number;
  verificationStatus: string;
};

type CopilotResponse = {
  loanId: number;
  loanNumber: string;

  intent: string;
  answer: string;

  recommendation: string;
  severity: string;

  riskScore: number;
  riskLevel: string;

  validationPassed: boolean;
  validationErrorCount: number;

  sources: string[];
};

type ChatMessage = {
  id: number;
  role: "user" | "copilot";
  question?: string;
  response?: CopilotResponse;
};

const suggestedQuestions = [
  "Can I approve this loan?",
  "What are the exceptions?",
  "Explain the risk",
  "Why is this loan pending?",
  "What should I fix before approval?",
  "Summarize this loan",
];

/* =========================================================
   COMPONENT
========================================================= */

function Copilot() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  /* =======================================================
     STATE
  ======================================================= */

  const [loanId, setLoanId] =
    useState(
      searchParams.get("loanId") || ""
    );

  const [loan, setLoan] =
    useState<Loan | null>(null);

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loanLoading, setLoanLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [messageCounter, setMessageCounter] =
    useState(0);

  /* =========================================================
     AUTH
  ========================================================= */

  function getToken() {
    return localStorage.getItem(
      "loanguard_token"
    );
  }

  function logout() {
    localStorage.removeItem(
      "loanguard_token"
    );

    navigate("/");
  }

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = getToken();

    if (!token) {
      logout();

      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const headers = new Headers(
      options.headers || {}
    );

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

    headers.set(
      "Accept",
      "application/json"
    );

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const response =
      await fetch(url, {
        ...options,
        headers,
      });

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      logout();

      throw new Error(
        "Your session has expired or you do not have permission to access this resource."
      );
    }

    return response;
  }

  /* =========================================================
     BACKEND ERROR
  ========================================================= */

  async function getBackendError(
    response: Response,
    fallback: string
  ): Promise<string> {
    try {
      const data =
        await response.json();

      return (
        data?.message ||
        data?.error ||
        fallback
      );
    } catch {
      return fallback;
    }
  }

  /* =========================================================
     LOAD LOAN
  ========================================================= */

  async function loadLoan(
    requestedId?: string
  ) {
    const cleanId =
      (
        requestedId ??
        loanId
      ).trim();

    if (!cleanId) {
      setError(
        "Enter a loan ID first."
      );

      return;
    }

    if (!/^\d+$/.test(cleanId)) {
      setError(
        "Loan ID must be a numeric ID, for example 36."
      );

      return;
    }

    try {
      setLoanLoading(true);
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/loans/${cleanId}`
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            `Unable to load loan ${cleanId}.`
          )
        );
      }

      const data: Loan =
        await response.json();

      setLoan(data);

      setLoanId(
        String(data.id)
      );

      setMessages([]);

      setQuestion("");

      /*
       * Keep URL synchronized with
       * the currently selected loan.
       */

      setSearchParams({
        loanId: String(data.id),
      });

    } catch (err) {
      console.error(
        "Copilot loan loading error:",
        err
      );

      setLoan(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the loan."
      );

    } finally {
      setLoanLoading(false);
    }
  }

  /* =========================================================
     LOAD LOAN FROM URL
  ========================================================= */

  useEffect(() => {
    const urlLoanId =
      searchParams.get("loanId");

    if (!urlLoanId) {
      return;
    }

    setLoanId(urlLoanId);

    loadLoan(urlLoanId);

    // Intentionally run once on initial URL load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     ASK COPILOT
  ========================================================= */

  async function askCopilot(
    requestedQuestion?: string
  ) {
    const cleanLoanId =
      loanId.trim();

    const cleanQuestion =
      (
        requestedQuestion ??
        question
      ).trim();

    if (!cleanLoanId) {
      setError(
        "Enter and open a loan before asking Copilot."
      );

      return;
    }

    if (!/^\d+$/.test(cleanLoanId)) {
      setError(
        "Loan ID must be numeric."
      );

      return;
    }

    if (!cleanQuestion) {
      return;
    }

    /*
     * If a loan isn't loaded yet,
     * load it before asking the AI.
     */

    if (
      !loan ||
      String(loan.id) !== cleanLoanId
    ) {
      await loadLoan(cleanLoanId);

      /*
       * Don't continue here because React state
       * updates asynchronously. User can ask again
       * after the loan loads.
       */

      return;
    }

    try {
      setLoading(true);
      setError("");

      const userMessageId =
        messageCounter + 1;

      setMessageCounter(
        userMessageId
      );

      setMessages(
        previous => [
          ...previous,
          {
            id: userMessageId,
            role: "user",
            question:
              cleanQuestion,
          },
        ]
      );

      setQuestion("");

      /*
       * REAL LOANGUARD COPILOT API
       *
       * POST
       * /api/copilot/loans/{id}
       */

      const response =
        await authenticatedFetch(
          `${API_URL}/copilot/loans/${cleanLoanId}`,
          {
            method: "POST",

            body: JSON.stringify({
              question:
                cleanQuestion,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            "Unable to get an answer from LoanGuard Copilot."
          )
        );
      }

      const result:
        CopilotResponse =
        await response.json();

      const copilotMessageId =
        userMessageId + 1;

      setMessageCounter(
        copilotMessageId
      );

      setMessages(
        previous => [
          ...previous,
          {
            id:
              copilotMessageId,
            role: "copilot",
            response:
              result,
          },
        ]
      );

    } catch (err) {
      console.error(
        "Copilot error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to get a Copilot response."
      );

    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FORM
  ========================================================= */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    askCopilot();
  }

  /* =========================================================
     LOAN ID ENTER
  ========================================================= */

  function handleLoanIdKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      loadLoan();
    }
  }

  /* =========================================================
     SUGGESTION
  ========================================================= */

  function useSuggestion(
    suggestion: string
  ) {
    setQuestion(
      suggestion
    );

    askCopilot(
      suggestion
    );
  }

  /* =========================================================
     CLEAR CHAT
  ========================================================= */

  function clearChat() {
    setMessages([]);

    setError("");

    setQuestion("");

    setMessageCounter(0);
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function goDashboard() {
    navigate(
      "/dashboard"
    );
  }

  function goLoans() {
    navigate(
      "/loans"
    );
  }

  function goExceptions() {
    navigate(
      "/exceptions"
    );
  }

  function goAnalytics() {
    navigate(
      "/analytics"
    );
  }

  function goAudit() {
    /*
     * Keep this compatible with the existing
     * application routing.
     */

    navigate(
      "/audit"
    );
  }

  /* =========================================================
     FORMAT MONEY
  ========================================================= */

  function formatMoney(
    value:
      | number
      | null
      | undefined
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  }

  /* =========================================================
     RISK CLASS
  ========================================================= */

  function getRiskClass(
    level: string
  ) {
    switch (
      level?.toUpperCase()
    ) {
      case "LOW":
        return "risk-low";

      case "MEDIUM":
        return "risk-medium";

      case "HIGH":
      case "CRITICAL":
        return "risk-high";

      default:
        return "";
    }
  }

  /* =========================================================
     RECOMMENDATION CLASS
  ========================================================= */

  function getRecommendationClass(
    recommendation: string
  ) {
    const value =
      recommendation?.toUpperCase();

    if (
      value === "APPROVE"
    ) {
      return "text-success";
    }

    if (
      value.includes("REVIEW") ||
      value.includes("REJECT")
    ) {
      return "text-danger";
    }

    return "";
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="copilot-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="copilot-sidebar">

        <div className="copilot-brand">

          <div className="copilot-logo">
            ✦
          </div>

          <div>
            <strong>
              LoanGuard
            </strong>

            <span>
              AI COPILOT
            </span>
          </div>

        </div>

        <div className="copilot-sidebar-section">

          <span className="sidebar-label">
            WORKSPACE
          </span>

          <button
            type="button"
            className="sidebar-item"
            onClick={
              goDashboard
            }
          >
            <span>⌂</span>
            Overview
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={
              goLoans
            }
          >
            <span>▣</span>
            Loan Records
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={
              goExceptions
            }
          >
            <span>!</span>
            Exceptions
          </button>

          <button
            type="button"
            className="sidebar-item active"
          >
            <span>✦</span>
            AI Copilot
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={
              goAudit
            }
          >
            <span>✓</span>
            Audit Trail
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={
              goAnalytics
            }
          >
            <span>◈</span>
            Analytics
          </button>

        </div>

        <div className="copilot-sidebar-bottom">

          <div className="copilot-status">

            <span className="status-dot" />

            <div>
              <strong>
                Copilot Online
              </strong>

              <span>
                LoanGuard AI engine
              </span>
            </div>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={
              logout
            }
          >
            Sign out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="copilot-main">

        {/* HEADER */}

        <header className="copilot-header">

          <div>

            <div className="copilot-eyebrow">
              INTELLIGENT LOAN ANALYSIS
            </div>

            <h1>
              AI Copilot
            </h1>

            <p>
              Ask questions about loan records,
              validation exceptions, risk,
              approval readiness, and recommended
              reviewer actions.
            </p>

          </div>

          <button
            type="button"
            className="clear-button"
            onClick={
              clearChat
            }
            disabled={
              messages.length === 0
            }
          >
            Clear conversation
          </button>

        </header>

        {/* ===================================================
            LOAN CONTEXT
        =================================================== */}

        <section className="loan-context-card">

          <div className="loan-context-icon">
            ◈
          </div>

          <div className="loan-context-content">

            <span>
              CURRENT LOAN
            </span>

            <strong>
              {loan
                ? `${loan.loanNumber} · ${loan.borrowerName}`
                : "No loan selected"}
            </strong>

          </div>

          {loan && (
            <div className="loan-context-content">

              <span>
                BALANCE
              </span>

              <strong>
                {formatMoney(
                  loan.currentBalance
                )}
              </strong>

            </div>
          )}

          {loan && (
            <div className="loan-context-content">

              <span>
                STATUS
              </span>

              <strong>
                {loan.verificationStatus
                  ?.replaceAll(
                    "_",
                    " "
                  )}
              </strong>

            </div>
          )}

          <div className="loan-id-input">

            <label
              htmlFor="loan-id"
            >
              LOAN ID
            </label>

            <input
              id="loan-id"
              value={loanId}
              onChange={event =>
                setLoanId(
                  event.target.value
                )
              }
              onKeyDown={
                handleLoanIdKeyDown
              }
              placeholder="36"
              inputMode="numeric"
              aria-label="Loan ID"
            />

            <button
              type="button"
              className="open-loan-button"
              onClick={() =>
                loadLoan()
              }
              disabled={
                loanLoading
              }
            >
              {loanLoading
                ? "Loading..."
                : "Open Loan"}
            </button>

          </div>

        </section>

        {/* ===================================================
            CHAT
        =================================================== */}

        <section className="copilot-chat">

          {/* CHAT HEADER */}

          <div className="chat-header">

            <div className="chat-agent">

              <div className="agent-avatar">
                ✦
              </div>

              <div>

                <strong>
                  LoanGuard Copilot
                </strong>

                <span>
                  Loan intelligence assistant
                </span>

              </div>

            </div>

            <div className="online-pill">

              <span />

              ONLINE

            </div>

          </div>

          {/* CHAT BODY */}

          <div className="chat-body">

            {messages.length === 0 &&
              !loading && (

                <div className="chat-message">

                  <div className="message-avatar">
                    ✦
                  </div>

                  <div className="message-content">

                    <div className="message-label">
                      COPILOT
                    </div>

                    <div className="message-bubble">

                      {loan ? (
                        <>
                          <strong>
                            I'm ready to review{" "}
                            {loan.loanNumber}.
                          </strong>

                          <br />

                          Ask me about its
                          validation status,
                          risk, exceptions,
                          approval readiness,
                          or what needs to be
                          fixed.
                        </>
                      ) : (
                        <>
                          <strong>
                            Welcome to LoanGuard
                            Copilot.
                          </strong>

                          <br />

                          Enter a loan ID above
                          and click{" "}
                          <strong>
                            Open Loan
                          </strong>{" "}
                          to start.
                        </>
                      )}

                    </div>

                  </div>

                </div>

              )}

            {messages.map(
              message => {

                /* USER */

                if (
                  message.role ===
                  "user"
                ) {
                  return (
                    <div
                      className="chat-message user-message"
                      key={
                        message.id
                      }
                    >

                      <div className="message-avatar">
                        You
                      </div>

                      <div className="message-content">

                        <div className="message-label">
                          YOU
                        </div>

                        <div className="message-bubble">
                          {
                            message.question
                          }
                        </div>

                      </div>

                    </div>
                  );
                }

                /* COPILOT */

                const result =
                  message.response;

                if (!result) {
                  return null;
                }

                return (
                  <div
                    className="chat-message"
                    key={
                      message.id
                    }
                  >

                    <div className="message-avatar">
                      ✦
                    </div>

                    <div className="message-content">

                      <div className="message-label">
                        COPILOT
                      </div>

                      <div className="message-bubble">

                        {result.answer}

                      </div>

                      {/* INSIGHTS */}

                      <div className="response-insights">

                        <div className="insight-card">

                          <span>
                            RECOMMENDATION
                          </span>

                          <strong
                            className={
                              getRecommendationClass(
                                result.recommendation
                              )
                            }
                          >
                            {result
                              .recommendation
                              ?.replaceAll(
                                "_",
                                " "
                              )}
                          </strong>

                        </div>

                        <div className="insight-card">

                          <span>
                            RISK
                          </span>

                          <strong
                            className={
                              getRiskClass(
                                result.riskLevel
                              )
                            }
                          >
                            {result.riskLevel}
                          </strong>

                          <small>
                            Score{" "}
                            {result.riskScore}
                            /100
                          </small>

                        </div>

                        <div className="insight-card">

                          <span>
                            VALIDATION
                          </span>

                          <strong
                            className={
                              result.validationPassed
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            {result.validationPassed
                              ? "PASSED"
                              : "ISSUES FOUND"}
                          </strong>

                          <small>
                            {
                              result.validationErrorCount
                            }{" "}
                            issue
                            {
                              result.validationErrorCount ===
                              1
                                ? ""
                                : "s"
                            }
                          </small>

                        </div>

                      </div>

                      {/* INTENT */}

                      {result.intent && (
                        <div className="source-row">

                          <span>
                            Analysis:
                          </span>

                          <span className="source-tag">
                            {result.intent.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                        </div>
                      )}

                      {/* SOURCES */}

                      {result.sources?.length >
                        0 && (

                        <div className="source-row">

                          <span>
                            Sources:
                          </span>

                          {result.sources.map(
                            source => (

                              <span
                                className="source-tag"
                                key={
                                  source
                                }
                              >
                                {source}
                              </span>

                            )
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                );
              }
            )}

            {/* TYPING */}

            {loading && (

              <div className="chat-message">

                <div className="message-avatar">
                  ✦
                </div>

                <div className="message-content">

                  <div className="message-label">
                    COPILOT
                  </div>

                  <div className="message-bubble typing-bubble">

                    <span />
                    <span />
                    <span />

                    <em>
                      Analyzing loan...
                    </em>

                  </div>

                </div>

              </div>

            )}

          </div>

          {/* =================================================
              SUGGESTIONS
          ================================================= */}

          <div className="suggestions">

            <span className="suggestions-label">
              ASK ABOUT THIS LOAN
            </span>

            <div className="suggestion-list">

              {suggestedQuestions.map(
                suggestion => (

                  <button
                    key={
                      suggestion
                    }
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        suggestion
                      )
                    }
                    disabled={
                      loading ||
                      !loan
                    }
                  >
                    {suggestion}
                  </button>

                )
              )}

            </div>

          </div>

          {/* ERROR */}

          {error && (

            <div className="copilot-error">

              <span>
                !
              </span>

              <div>
                {error}
              </div>

            </div>

          )}

          {/* =================================================
              INPUT
          ================================================= */}

          <form
            className="copilot-input-area"
            onSubmit={
              handleSubmit
            }
          >

            <div className="input-wrapper">

              <span className="input-icon">
                ✦
              </span>

              <input
                value={question}
                onChange={event =>
                  setQuestion(
                    event.target.value
                  )
                }
                placeholder={
                  loan
                    ? "Ask anything about this loan..."
                    : "Open a loan first..."
                }
                disabled={
                  loading ||
                  !loan
                }
                aria-label="Ask LoanGuard Copilot"
              />

            </div>

            <button
              className="send-button"
              type="submit"
              disabled={
                loading ||
                !question.trim() ||
                !loan
              }
            >
              {loading
                ? "..."
                : "Ask"}

              <span>
                →
              </span>

            </button>

          </form>

          <div className="copilot-disclaimer">
            Copilot provides analysis based on
            LoanGuard's configured loan data,
            validation engine, and risk engine.
            Final approval remains with the
            authorized reviewer.
          </div>

        </section>

      </main>

    </div>
  );
}

export default Copilot;