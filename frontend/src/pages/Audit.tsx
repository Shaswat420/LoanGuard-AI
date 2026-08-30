import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "./Audit.css";

const API_URL = "http://localhost:8082/api";

type AuditLog = {
  id: number;
  loanId: number;
  loanNumber: string;
  eventType: string;
  description: string;
  actor: string;
  createdAt: string;
  recordHash: string;
};

function Audit() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [loanId, setLoanId] = useState(
    searchParams.get("loanId") || ""
  );

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = useCallback(() => {
    return localStorage.getItem(
      "loanguard_token"
    );
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(
      "loanguard_token"
    );

    localStorage.removeItem(
      "loanguard_user"
    );

    navigate("/", {
      replace: true,
    });
  }, [navigate]);

  const authenticatedFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {}
    ) => {
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

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        logout();

        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      return response;
    },
    [getToken, logout]
  );

  const loadAuditLogs = useCallback(
    async (selectedLoanId: string) => {
      if (!selectedLoanId.trim()) {
        setLogs([]);
        return;
      }

      if (!/^\d+$/.test(selectedLoanId.trim())) {
        setError(
          "Loan ID must be a valid number."
        );

        setLogs([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await authenticatedFetch(
            `${API_URL}/audit/loans/${selectedLoanId.trim()}`
          );

        if (!response.ok) {
          let message =
            `Unable to load audit trail. Server returned ${response.status}.`;

          try {
            const body =
              await response.json();

            if (body?.message) {
              message = body.message;
            }
          } catch {
            // Ignore invalid error response.
          }

          throw new Error(message);
        }

        const data: AuditLog[] =
          await response.json();

        setLogs(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Audit loading error:",
          error
        );

        setLogs([]);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load audit trail."
        );
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  useEffect(() => {
    const urlLoanId =
      searchParams.get("loanId");

    if (urlLoanId) {
      setLoanId(urlLoanId);

      loadAuditLogs(urlLoanId);
    }
  }, [
    searchParams,
    loadAuditLogs,
  ]);

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = loanId.trim();

    if (!value) {
      setError(
        "Enter a loan ID to view its audit trail."
      );

      setLogs([]);

      return;
    }

    setSearchParams({
      loanId: value,
    });

    loadAuditLogs(value);
  }

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "medium",
      }
    );
  }

  function getEventClass(
    eventType: string
  ) {
    const value =
      eventType
        ?.toUpperCase()
        .replaceAll("_", "-");

    if (
      value.includes("APPROVED")
    ) {
      return "audit-event approved";
    }

    if (
      value.includes("REJECT")
    ) {
      return "audit-event rejected";
    }

    if (
      value.includes("AI")
    ) {
      return "audit-event ai";
    }

    if (
      value.includes("VALIDATION")
    ) {
      return "audit-event validation";
    }

    if (
      value.includes("CREATED")
    ) {
      return "audit-event created";
    }

    return "audit-event";
  }

  return (
    <div className="audit-page">

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside className="audit-sidebar">

        <div className="audit-brand">

          <div className="audit-logo">
            ✓
          </div>

          <div>
            <strong>
              LoanGuard
            </strong>

            <span>
              VERIFICATION PLATFORM
            </span>
          </div>

        </div>

        <nav className="audit-nav">

          <button
            type="button"
            className="audit-nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            type="button"
            className="audit-nav-item"
            onClick={() =>
              navigate("/loans")
            }
          >
            <span>▣</span>
            Loan Records
          </button>

          <button
            type="button"
            className="audit-nav-item"
            onClick={() =>
              navigate("/exceptions")
            }
          >
            <span>!</span>
            Exceptions
          </button>

          <button
            type="button"
            className="audit-nav-item"
            onClick={() =>
              navigate("/copilot")
            }
          >
            <span>✦</span>
            AI Copilot
          </button>

          <button
            type="button"
            className="audit-nav-item active"
          >
            <span>✓</span>
            Audit Trail
          </button>

          <button
            type="button"
            className="audit-nav-item"
            onClick={() =>
              navigate("/analytics")
            }
          >
            <span>◈</span>
            Analytics
          </button>

        </nav>

        <div className="audit-sidebar-bottom">

          <div className="audit-system-status">

            <span className="status-dot" />

            <div>
              <strong>
                System Operational
              </strong>

              <span>
                All services online
              </span>
            </div>

          </div>

          <button
            type="button"
            className="audit-logout"
            onClick={logout}
          >
            Sign out
          </button>

        </div>

      </aside>

      {/* =========================================
          MAIN
      ========================================= */}

      <main className="audit-main">

        <header className="audit-header">

          <div>

            <div className="audit-eyebrow">
              GOVERNANCE & TRACEABILITY
            </div>

            <h1>
              Audit Trail
            </h1>

            <p>
              Review immutable system activity,
              validation events, AI recommendations,
              and reviewer decisions.
            </p>

          </div>

          <button
            type="button"
            className="audit-back-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

        </header>

        {/* =========================================
            SEARCH
        ========================================= */}

        <section className="audit-search-card">

          <div>

            <span className="audit-section-label">
              LOAN AUDIT HISTORY
            </span>

            <h2>
              Select a loan
            </h2>

            <p>
              Enter a loan ID to retrieve its
              complete audit history.
            </p>

          </div>

          <form
            className="audit-search-form"
            onSubmit={handleSearch}
          >

            <input
              type="text"
              inputMode="numeric"
              value={loanId}
              onChange={(event) =>
                setLoanId(
                  event.target.value
                )
              }
              placeholder="Loan ID e.g. 36"
              aria-label="Loan ID"
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "View Audit"}
            </button>

          </form>

        </section>

        {/* =========================================
            ERROR
        ========================================= */}

        {error && (
          <div className="audit-error">
            <span>!</span>
            <div>
              <strong>
                Unable to load audit trail
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            SUMMARY
        ========================================= */}

        {loanId && !error && (
          <section className="audit-summary">

            <div className="audit-summary-card">

              <span>
                LOAN ID
              </span>

              <strong>
                #{loanId}
              </strong>

            </div>

            <div className="audit-summary-card">

              <span>
                AUDIT EVENTS
              </span>

              <strong>
                {logs.length}
              </strong>

            </div>

            <div className="audit-summary-card">

              <span>
                LATEST ACTOR
              </span>

              <strong>
                {logs.length > 0
                  ? logs[
                      logs.length - 1
                    ].actor
                  : "—"}
              </strong>

            </div>

          </section>
        )}

        {/* =========================================
            AUDIT CONTENT
        ========================================= */}

        <section className="audit-panel">

          <div className="audit-panel-heading">

            <div>

              <span>
                ACTIVITY LOG
              </span>

              <h2>
                Chain of events
              </h2>

            </div>

            {loanId && (
              <button
                type="button"
                className="audit-refresh"
                onClick={() =>
                  loadAuditLogs(
                    loanId
                  )
                }
                disabled={loading}
              >
                ↻ Refresh
              </button>
            )}

          </div>

          {loading ? (

            <div className="audit-empty">

              <div className="audit-spinner" />

              <h3>
                Loading audit history...
              </h3>

              <p>
                Retrieving recorded system events.
              </p>

            </div>

          ) : !loanId ? (

            <div className="audit-empty">

              <div className="audit-empty-icon">
                ✓
              </div>

              <h3>
                No loan selected
              </h3>

              <p>
                Enter a loan ID above to inspect
                its complete audit trail.
              </p>

            </div>

          ) : logs.length === 0 ? (

            <div className="audit-empty">

              <div className="audit-empty-icon">
                —
              </div>

              <h3>
                No audit events found
              </h3>

              <p>
                No recorded events were found
                for loan #{loanId}.
              </p>

            </div>

          ) : (

            <div className="audit-timeline">

              {logs
                .slice()
                .reverse()
                .map((log) => (

                  <article
                    className="audit-entry"
                    key={log.id}
                  >

                    <div className="audit-entry-line">
                      <div className="audit-entry-dot">
                        ✓
                      </div>
                    </div>

                    <div className="audit-entry-card">

                      <div className="audit-entry-top">

                        <div>

                          <span
                            className={getEventClass(
                              log.eventType
                            )}
                          >
                            {log.eventType
                              ?.replaceAll(
                                "_",
                                " "
                              )}
                          </span>

                          <h3>
                            {log.description}
                          </h3>

                        </div>

                        <time>
                          {formatDate(
                            log.createdAt
                          )}
                        </time>

                      </div>

                      <div className="audit-entry-meta">

                        <div>
                          <span>
                            ACTOR
                          </span>

                          <strong>
                            {log.actor}
                          </strong>
                        </div>

                        <div>
                          <span>
                            LOAN
                          </span>

                          <strong>
                            {log.loanNumber}
                          </strong>
                        </div>

                        <div>
                          <span>
                            EVENT ID
                          </span>

                          <strong>
                            #{log.id}
                          </strong>
                        </div>

                      </div>

                      <div className="audit-hash">

                        <span>
                          RECORD HASH
                        </span>

                        <code>
                          {log.recordHash}
                        </code>

                      </div>

                    </div>

                  </article>

                ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Audit;