import { Routes, Route, Link, useLocation } from "react-router-dom";
import PortfolioPage from "./pages/Portfolio";
import DealerPage from "./pages/Dealer";
import KpiActionPlansPage from "./pages/KpiActionPlans";
import DataPage from "./pages/Data";
import ExecutivePage from "./pages/Executive";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-transition">
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/dealers/:dealerId" element={<DealerPage />} />
        <Route path="/dealers/:dealerId/kpi-plans" element={<KpiActionPlansPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
