import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LoanDashboard from "./pages/LoanDashboard";
import LoanRecords from "./pages/LoanRecords";
import AddLoan from "./pages/AddLoan";
import UploadLoanTape from "./pages/UploadLoanTape";
import Reviewer from "./pages/Reviewer";
import Analytics from "./pages/Analytics";
import Copilot from "./pages/Copilot";
import Exceptions from "./pages/Exceptions";
import Audit from "./pages/Audit";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================================
            LOGIN
        ========================================= */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* =========================================
            DASHBOARD
        ========================================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* =========================================
            LOAN DASHBOARD
        ========================================= */}

        <Route
          path="/loan-dashboard"
          element={<LoanDashboard />}
        />

        {/* =========================================
            LOAN RECORDS
        ========================================= */}

        <Route
          path="/loans"
          element={<LoanRecords />}
        />

        {/* =========================================
            ADD LOAN
        ========================================= */}

        <Route
          path="/add-loan"
          element={<AddLoan />}
        />

        {/* =========================================
            UPLOAD
        ========================================= */}

        <Route
          path="/upload"
          element={<UploadLoanTape />}
        />

        {/* =========================================
            REVIEWER
        ========================================= */}

        <Route
          path="/reviewer/:id"
          element={<Reviewer />}
        />

        {/* =========================================
            ANALYTICS
        ========================================= */}

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        {/* =========================================
            EXCEPTIONS
        ========================================= */}

        <Route
          path="/exceptions"
          element={<Exceptions />}
        />

        {/* =========================================
            AI COPILOT
        ========================================= */}

        <Route
          path="/copilot"
          element={<Copilot />}
        />

        <Route
          path="/ai-copilot"
          element={<Copilot />}
        />

        {/* =========================================
            AUDIT TRAIL
        ========================================= */}

        <Route
          path="/audit"
          element={<Audit />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;