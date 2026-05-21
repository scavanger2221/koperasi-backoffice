import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Anggota = lazy(() => import("@/pages/Anggota"));
const SimpananPage = lazy(() => import("@/pages/Simpanan"));
const PinjamanPage = lazy(() => import("@/pages/Pinjaman"));
const BukuKasPage = lazy(() => import("@/pages/BukuKas"));
const LaporanPage = lazy(() => import("@/pages/Laporan"));
const TagihanPage = lazy(() => import("@/pages/Tagihan"));
const AuditLogPage = lazy(() => import("@/pages/AuditLog"));
const SHUPage = lazy(() => import("@/pages/SHU"));
const RATPage = lazy(() => import("@/pages/RAT"));
const UsersPage = lazy(() => import("@/pages/Users"));
const PengaturanPage = lazy(() => import("@/pages/Pengaturan"));
const PeriodeBukuPage = lazy(() => import("@/pages/PeriodeBuku"));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !token) {
      navigate("/login", { replace: true });
    }
  }, [ready, token, navigate]);

  if (!ready || !token) return null;

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/anggota"
        element={
          <PrivateRoute>
            <Anggota />
          </PrivateRoute>
        }
      />
      <Route
        path="/simpanan"
        element={
          <PrivateRoute>
            <SimpananPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/pinjaman"
        element={
          <PrivateRoute>
            <PinjamanPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/buku-kas"
        element={
          <PrivateRoute>
            <BukuKasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/laporan"
        element={
          <PrivateRoute>
            <LaporanPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/tagihan"
        element={
          <PrivateRoute>
            <TagihanPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <PrivateRoute>
            <AuditLogPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/shu"
        element={
          <PrivateRoute>
            <SHUPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/rat"
        element={
          <PrivateRoute>
            <RATPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/pengaturan"
        element={
          <PrivateRoute>
            <PengaturanPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/periode-buku"
        element={
          <PrivateRoute>
            <PeriodeBukuPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  );
}
