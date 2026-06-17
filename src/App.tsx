import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Geology from "@/pages/Geology";
import Drilling from "@/pages/Drilling";
import Production from "@/pages/Production";
import Storage from "@/pages/Storage";
import Equipment from "@/pages/Equipment";
import Safety from "@/pages/Safety";
import System from "@/pages/System";
import Layout from "@/components/Layout";
import { useUserStore } from "@/store/userStore";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <Login />
            </RedirectIfAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/geology" element={<Geology />} />
          <Route path="/drilling" element={<Drilling />} />
          <Route path="/production" element={<Production />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/maintenance" element={<Equipment />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/system" element={<System />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
