import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Anggota from "@/pages/Anggota";
import SimpananPage from "@/pages/Simpanan";
import PinjamanPage from "@/pages/Pinjaman";
import BukuKasPage from "@/pages/BukuKas";
import LaporanPage from "@/pages/Laporan";
import TagihanPage from "@/pages/Tagihan";
import AuditLogPage from "@/pages/AuditLog";
import SHUPage from "@/pages/SHU";
import RATPage from "@/pages/RAT";
import UsersPage from "@/pages/Users";
import PengaturanPage from "@/pages/Pengaturan";
import PeriodeBukuPage from "@/pages/PeriodeBuku";

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
      <AppRoutes />
    </AuthProvider>
  );
}
