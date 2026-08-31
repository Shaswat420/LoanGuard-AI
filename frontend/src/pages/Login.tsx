import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "https://loanguard-ai-2y9l.onrender.com/api";

interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
  message?: string;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password.trim()
    ) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        }
      );

      let data:
        | LoginResponse
        | ErrorResponse
        | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorData =
          data as ErrorResponse | null;

        throw new Error(
          errorData?.message ||
            errorData?.error ||
            "Invalid email or password."
        );
      }

      const loginData =
        data as LoginResponse | null;

      if (!loginData?.token) {
        throw new Error(
          "Login succeeded, but no authentication token was returned."
        );
      }

      /*
       * Store JWT.
       */
      localStorage.setItem(
        "loanguard_token",
        loginData.token
      );

      /*
       * Store current user information.
       */
      localStorage.setItem(
        "loanguard_user",
        JSON.stringify({
          userId: loginData.userId,
          email: loginData.email,
          role: loginData.role,
        })
      );

      console.log(
        "LoanGuard login successful:",
        {
          userId: loginData.userId,
          email: loginData.email,
          role: loginData.role,
        }
      );

      /*
       * Navigate to dashboard.
       */
      navigate("/dashboard", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "LoanGuard login error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        {/* BRAND */}

        <div className="login-brand">

          <div className="brand-mark">
            L
          </div>

          <div>
            <h1>LoanGuard</h1>
            <span>AI</span>
          </div>

        </div>

        {/* LOGIN CARD */}

        <div className="login-card">

          <div className="login-heading">

            <div className="eyebrow">
              SECURE ACCESS
            </div>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to access your loan
              verification workspace.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@company.com"
                autoComplete="email"
                disabled={isLoading}
              />

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-button"
                  disabled={isLoading}
                  onClick={() => {
                    setError(
                      "Password recovery is available in the production version."
                    );
                  }}
                >
                  Forgot password?
                </button>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />

            </div>

            {/* ERROR */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >

              {isLoading
                ? "Signing in..."
                : "Sign in"}

              {!isLoading && (
                <span>→</span>
              )}

            </button>

          </form>

          {/* DIVIDER */}

          <div className="login-divider">

            <span />

            <p>
              LOANGUARD AI
            </p>

            <span />

          </div>

          {/* SECURITY */}

          <div className="security-note">

            <span className="security-icon">
              ✓
            </span>

            <div>

              <strong>
                Secure workspace
              </strong>

              <p>
                Your verification activity is
                protected and audit tracked.
              </p>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <p className="login-footer">
          LoanGuard AI · Loan Data Verification Copilot
        </p>

      </div>

    </div>
  );
}

export default Login;