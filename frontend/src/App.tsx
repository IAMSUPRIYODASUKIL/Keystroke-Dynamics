import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Register } from "@/pages/Register";
import { Login } from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";

// Authenticated pages are code-split so the landing page stays light (recharts only loads with analytics).
const Enroll = lazy(() => import("@/pages/Enroll").then((m) => ({ default: m.Enroll })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const MLAnalytics = lazy(() => import("@/pages/MLAnalytics").then((m) => ({ default: m.MLAnalytics })));
const SecurityActivity = lazy(() => import("@/pages/SecurityActivity").then((m) => ({ default: m.SecurityActivity })));
const DemoMode = lazy(() => import("@/pages/DemoMode").then((m) => ({ default: m.DemoMode })));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="enroll" element={<Enroll />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<MLAnalytics />} />
          <Route path="activity" element={<SecurityActivity />} />
          <Route path="demo" element={<DemoMode />} />
        </Route>

        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
