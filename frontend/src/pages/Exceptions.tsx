import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Exceptions.css";

const API_URL = "https://loanguard-ai-2y9l.onrender.com/api";

type ValidationIssue = {
  rule: string;
  field: string;
  severity: string;
  message: string;
  actualValue: string | null;
  expectedValue: string;
};

type ExceptionRecord = {
  loanId: number;
  loanNumber: string;
  borrowerName: string;
  verificationStatus: string;
  validationErrorCount: number;
  valid: boolean;
  issues: ValidationIssue[];
};

function Exceptions() {
  const navigate = useNavigate();

  const [exceptions, setExceptions] =
    useState<ExceptionRecord[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [message, setMessage] =
    useState<string>("");

  function getToken(): string | null {
    return localStorage.getItem(
      "loanguard_token"
    );
  }

  function logout(): void {
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

    const response = await fetch(
      url,
      {
        ...options,
        headers,
      }
    );

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

  async function loadExceptions(): Promise<void> {

    try {
      setLoading(true);
      setMessage("");

      const response =
        await authenticatedFetch(
          `${API_URL}/exceptions`
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            `Unable to load exceptions. Server returned ${response.status}.`
          )
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Backend returned an unexpected exceptions response."
        );
      }

      setExceptions(
        data as ExceptionRecord[]
      );

    } catch (error) {

      console.error(
        "Exception loading error:",
        error
      );

      setExceptions([]);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load exceptions."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExceptions();
  }, []);

  function getSeverityClass(
    severity: string
  ): string {

    const value =
      severity?.toUpperCase();

    if (value === "HIGH") {
      return "exception-severity high";
    }

    if (value === "MEDIUM") {
      return "exception-severity medium";
    }

    return "exception-severity low";
  }

  const highSeverityCount =
    exceptions.filter(
      (exception) =>
        exception.issues?.some(
          (issue) =>
            issue.severity?.toUpperCase() ===
            "HIGH"
        )
    ).length;

  const totalValidationIssues =
    exceptions.reduce(
      (total, exception) =>
        total +
        (exception.validationErrorCount || 0),
      0
    );

  return (
    <div className="exceptions-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="exceptions-header">

        <div>

          <div className="exceptions-eyebrow">
            LOAN DATA QUALITY
          </div>

          <h1>
            Exceptions
          </h1>

          <p>
            Review loan records that require
            human attention before verification.
          </p>

        </div>

        <button
          type="button"
          className="exceptions-refresh"
          onClick={loadExceptions}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </header>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="exception-summary">

        <div className="summary-card">

          <span>
            OPEN EXCEPTIONS
          </span>

          <strong>
            {exceptions.length}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            HIGH SEVERITY
          </span>

          <strong>
            {highSeverityCount}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            VALIDATION ISSUES
          </span>

          <strong>
            {totalValidationIssues}
          </strong>

        </div>

      </section>

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {message && (
        <div className="exception-message">
          {message}
        </div>
      )}

      {/* =====================================================
          REVIEW QUEUE
      ===================================================== */}

      <section className="exceptions-panel">

        <div className="exceptions-panel-heading">

          <div>

            <span>
              REVIEW QUEUE
            </span>

            <h2>
              Attention required
            </h2>

          </div>

          <span className="exception-count">
            {exceptions.length}{" "}
            {exceptions.length === 1
              ? "record"
              : "records"}
          </span>

        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (

          <div className="exception-empty">

            <div className="loading-spinner" />

            <h3>
              Loading exceptions...
            </h3>

            <p>
              Checking the latest validation
              results from LoanGuard.
            </p>

          </div>

        )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {!loading &&
          exceptions.length === 0 && (

          <div className="exception-empty">

            <div className="empty-check">
              ✓
            </div>

            <h3>
              No open exceptions
            </h3>

            <p>
              All currently loaded loan records
              have passed their configured
              validation checks.
            </p>

            <button
              type="button"
              className="review-button"
              onClick={() =>
                navigate("/loans")
              }
            >
              View Loan Records
            </button>

          </div>

        )}

        {/* ===================================================
            EXCEPTION LIST
        =================================================== */}

        {!loading &&
          exceptions.length > 0 && (

          <div className="exception-list">

            {exceptions.map(
              (exception) => (

              <article
                className="exception-card"
                key={exception.loanId}
              >

                {/* -------------------------------------------
                    LOAN HEADER
                ------------------------------------------- */}

                <div className="exception-card-top">

                  <div>

                    <span className="loan-number">
                      {exception.loanNumber}
                    </span>

                    <h3>
                      {exception.borrowerName}
                    </h3>

                  </div>

                  <span className="review-status">

                    {(
                      exception.verificationStatus ||
                      "NEEDS_REVIEW"
                    ).replaceAll(
                      "_",
                      " "
                    )}

                  </span>

                </div>

                {/* -------------------------------------------
                    ISSUES
                ------------------------------------------- */}

                <div className="exception-issues">

                  {exception.issues &&
                    exception.issues.length > 0 ? (

                    exception.issues.map(
                      (issue, index) => (

                        <div
                          className="exception-issue"
                          key={
                            `${issue.rule}-${index}`
                          }
                        >

                          <div className="issue-top">

                            <strong>
                              {issue.message}
                            </strong>

                            <span
                              className={
                                getSeverityClass(
                                  issue.severity
                                )
                              }
                            >
                              {issue.severity}
                            </span>

                          </div>

                          <div className="issue-details">

                            <span>
                              Rule:{" "}
                              {issue.rule}
                            </span>

                            <span>
                              Field:{" "}
                              {issue.field}
                            </span>

                            {issue.actualValue !==
                              null && (

                              <span>
                                Actual:{" "}
                                {issue.actualValue}
                              </span>

                            )}

                            <span>
                              Expected:{" "}
                              {issue.expectedValue}
                            </span>

                          </div>

                        </div>

                      )
                    )

                  ) : (

                    <div className="exception-issue">

                      <div className="issue-top">

                        <strong>
                          Validation issue detected
                        </strong>

                      </div>

                      <div className="issue-details">

                        <span>
                          Open the loan reviewer
                          for complete details.
                        </span>

                      </div>

                    </div>

                  )}

                </div>

                {/* -------------------------------------------
                    FOOTER
                ------------------------------------------- */}

                <div className="exception-card-footer">

                  <span>

                    {exception.validationErrorCount}
                    {" "}
                    validation issue
                    {exception.validationErrorCount === 1
                      ? ""
                      : "s"}

                  </span>

                  <button
                    type="button"
                    className="review-button"
                    onClick={() =>
                      navigate(
                        `/reviewer/${exception.loanId}`
                      )
                    }
                  >
                    Review Loan →
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Exceptions;