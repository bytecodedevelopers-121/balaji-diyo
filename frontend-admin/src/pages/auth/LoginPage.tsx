// src/pages/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Plane,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";
import type { LoginCredentials } from "@/types/auth";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(6, "Password must be at least 6 characters."),
});

const FLIGHT_PATH = "M14 68C78 68 103 31 164 42C217 53 253 19 326 20";

function FlightJourney() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-28 z-1 h-[90px] w-[340px] -translate-x-1/2"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 340 90"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <mask id="login-route-reveal">
            <path
              className="login-route-mask"
              d={FLIGHT_PATH}
              pathLength="1"
              stroke="white"
              strokeWidth="4"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          </mask>
        </defs>
        <path
          d={FLIGHT_PATH}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
          strokeDasharray="5 8"
          strokeLinecap="round"
          mask="url(#login-route-reveal)"
        />
        <g className="login-destination">
          <circle cx="326" cy="20" r="4.5" fill="none" stroke="rgba(255,255,255,0.46)" strokeWidth="1" />
          <circle cx="326" cy="20" r="1.5" fill="rgba(255,255,255,0.62)" />
        </g>
      </svg>

      <span className="login-tour-plane absolute left-0 top-0">
        <span className="login-tour-plane-body">
          <Plane className="h-4 w-4 text-white/65" />
        </span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Single login page for the CMS admin panel.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginCredentials) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await login(values.email, values.password);

      navigate(user.b2bPartnerId ? PATHS.PARTNER_HOME : PATHS.DASHBOARD, { replace: true });
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Invalid email or password.")
        : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-brand-navy px-4 py-8 font-sans sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_15%_10%,rgba(247,132,30,0.26),transparent_25%),radial-gradient(circle_at_90%_85%,rgba(7,140,191,0.4),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] opacity-25 [background:linear-gradient(145deg,transparent_0_18%,#078cbf_18.2%_19%,transparent_19.2%_31%,#f7841e_31.2%_32%,transparent_32.2%_100%)]" />

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_32px_100px_rgba(0,0,0,0.42)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden min-h-[620px] overflow-hidden bg-brand-surface p-10 text-white lg:flex lg:flex-col">
          <div className="login-panel-drift pointer-events-none absolute -inset-2 opacity-70 [background-image:radial-gradient(circle_at_80%_15%,rgba(247,132,30,0.32),transparent_23%),linear-gradient(155deg,transparent_0_53%,rgba(7,140,191,0.48)_53.2%_63%,transparent_63.2%),linear-gradient(35deg,transparent_0_64%,rgba(255,255,255,0.08)_64.2%_65%,transparent_65.2%)]" />

          <FlightJourney />

          <img
            src="/logo.png"
            alt="Joyful Trekking"
            className="login-enter-brand relative z-10 h-auto w-48"
          />

          <div className="login-enter-brand relative z-10 my-auto">
            <p className="max-w-xs text-3xl font-bold leading-tight tracking-tight font-display">
              Every great journey starts behind the scenes.
            </p>

            <div className="mt-8 flex gap-3 rounded-2xl border border-white/30 bg-brand-orange p-4 shadow-lg shadow-black/15">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" />
              <div>
                <p className="text-xs font-extrabold tracking-wide text-brand-navy uppercase">
                  Restricted access
                </p>
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-brand-navy/85">
                  This site is for administration purposes only. Please leave if
                  you do not have authorized access.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs font-medium tracking-[0.18em] text-white/45 uppercase">
            Administration portal
          </p>
        </aside>

        <main className="login-enter-form flex min-h-[580px] w-full flex-col justify-center bg-[#fffdf9] px-7 py-10 sm:px-12 lg:min-h-[620px] lg:px-16">
          <div className="mb-10 flex justify-center rounded-2xl bg-brand-surface px-5 py-3 lg:hidden">
            <img src="/logo.png" alt="Joyful Trekking" className="h-auto w-44" />
          </div>

          <div className="mb-9">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-brand-teal uppercase">
              Admin access
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface font-display sm:text-4xl">
              Sign in
            </h1>
          </div>

          {/* Error message alert display */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3.5 text-sm text-red-700 animate-wiggle shadow-sm shadow-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-bold tracking-wide text-on-surface-variant font-display"
              >
                Email address
              </label>
              <div className="relative group/input">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className={[
                    "peer w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm text-on-surface placeholder:text-slate-300 transition-all duration-200 outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    errors.email
                      ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-400/10"
                      : "border-[#dce4e5] bg-white hover:border-[#b8c8ca] focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10",
                  ].join(" ")}
                  {...register("email")}
                />
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-200 peer-focus:text-brand-teal" />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-red-600" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-bold tracking-wide text-on-surface-variant font-display"
              >
                Password
              </label>
              <div className="relative group/input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className={[
                    "peer w-full rounded-xl border py-3.5 pl-11 pr-11 text-sm text-on-surface placeholder:text-slate-300 transition-all duration-200 outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    errors.password
                      ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-400/10"
                      : "border-[#dce4e5] bg-white hover:border-[#b8c8ca] focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10",
                  ].join(" ")}
                  {...register("password")}
                />
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-200 peer-focus:text-brand-teal" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="login-password-toggle absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200 cursor-pointer p-0.5 rounded-md hover:bg-slate-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-red-600" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-orange/20 transition-all duration-200 hover:-translate-y-px hover:bg-[#e8730e] hover:shadow-xl hover:shadow-brand-orange/25 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
            Authorized team members only
          </p>
        </main>
      </div>
    </div>
  );
}
