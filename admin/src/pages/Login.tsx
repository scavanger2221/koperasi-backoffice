import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { rules, validate, type FieldErrors } from "@/lib/validation";

export default function Login() {
  const [email, setEmail] = useState("admin@koperasi.id");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate(
      { email, password },
      {
        email: [rules.required("Email"), rules.email()],
        password: [rules.required("Password"), rules.minLength(6, "Password")],
      }
    );
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError("");
    try {
      const res = await api<{ data: { token: string; user: any } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-aurora"></div>
      <div className="w-full max-w-[420px] bg-card/85 backdrop-blur-xl rounded-2xl border border-border shadow-2xl p-8 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4 shadow-md">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Koperasi Backoffice</h1>
          <p className="text-sm text-muted-foreground mt-1">Masuk ke dashboard admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`w-full h-10 px-3 rounded-lg border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                errors.email
                  ? "border-destructive focus:border-destructive"
                  : "border-input focus:border-primary"
              }`}
            />
            {errors.email && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password <span className="text-destructive">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              className={`w-full h-10 px-3 rounded-lg border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                errors.password
                  ? "border-destructive focus:border-destructive"
                  : "border-input focus:border-primary"
              }`}
            />
            {errors.password && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg transition-all disabled:opacity-60 flex items-center justify-center shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
