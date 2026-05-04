import { Navigate, useParams } from "react-router-dom";

export default function KpiActionPlansPage() {
  const { dealerId } = useParams<{ dealerId: string }>();
  return <Navigate to={`/dealers/${dealerId}?tab=kpi-plans`} replace />;
}
