import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Register } from "@/pages/Register";
import { Login } from "@/pages/Login";
import { Enroll } from "@/pages/Enroll";
import { Dashboard } from "@/pages/Dashboard";
import { MLAnalytics } from "@/pages/MLAnalytics";
import { SecurityActivity } from "@/pages/SecurityActivity";
import { DemoMode } from "@/pages/DemoMode";
import { NotFound } from "@/pages/NotFound";

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
