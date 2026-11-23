import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageCard } from "@/components/layout/PageCard";
import { KycFilePicker } from "@/components/b2b/KycFilePicker";
import { newKycRow, validateKycRows, type KycRow } from "@/components/b2b/kyc-files";
import { b2bPartnerService } from "@/services/b2b.service";
import { useAuthStore } from "@/store/auth.store";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

const schema = z.object({
  legalName: z.string().trim().min(2, "Legal name is required"),
  tradeName: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid business email"),
  phone: z.string().trim().optional(),
  country: z.string().trim().min(2, "Country is required"),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  website: z.string().trim().optional(),
  taxOrRegNumber: z.string().trim().optional(),
  adminFirstName: z.string().trim().min(1, "First name is required"),
  adminLastName: z.string().trim().min(1, "Last name is required"),
  adminEmail: z.string().trim().email("Enter a valid email"),
  adminPassword: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "At most 72 characters")
    .regex(/[A-Za-z]/, "Must contain a letter")
    .regex(/\d/, "Must contain a digit"),
});
type FormValues = z.infer<typeof schema>;

const STEPS = [
  { title: "Agency", fields: ["legalName", "tradeName", "email", "phone", "country", "city", "address", "website", "taxOrRegNumber"] as const },
  { title: "Administrator", fields: ["adminFirstName", "adminLastName", "adminEmail", "adminPassword"] as const },
  { title: "KYC documents", fields: [] as const },
];

/** Public, multi-step partner application: agency details → admin account → KYC documents. */
export default function PartnerRegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<KycRow[]>(() => [newKycRow()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { legalName: "", email: "", country: "", adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "" },
  });

  const next = async () => {
    if (await trigger([...STEPS[step].fields])) setStep((s) => s + 1);
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    // The KYC step is optional at registration (documents can be added from the dashboard), but any row shown must be valid.
    const withFiles = rows.filter((r) => r.file);
    const problem = validateKycRows(withFiles.length === 0 ? [] : rows, { requireOne: false });
    if (problem) return setError(problem);

    setSubmitting(true);
    try {
      await b2bPartnerService.register(values, withFiles.map((r) => ({ docType: r.docType, file: r.file as File })));
      try {
        await login(values.adminEmail, values.adminPassword);
        navigate(PATHS.PARTNER_HOME, { replace: true });
      } catch {
        navigate(PATHS.LOGIN, { replace: true });
      }
    } catch (err) {
      setError(getDetailedErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <img src="/logo.png" alt={COMPANY_INFO.name} className="mx-auto mb-6 h-10 w-auto" />
        <h1 className="text-center font-display text-2xl font-bold text-logo-navy-dark">Become a travel partner</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Apply for a B2B agency account. Our team reviews every application.</p>

        <ol className="my-6 flex items-center justify-center gap-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${i <= step ? "bg-logo-navy-dark text-white" : "bg-gray-200 text-gray-600"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i === step ? "font-semibold text-gray-900" : "text-gray-500"}>{s.title}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-gray-300" />}
            </li>
          ))}
        </ol>

        <PageCard>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

            <div className={step === 0 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
              <Input id="legalName" label="Legal name" required error={errors.legalName?.message} {...register("legalName")} />
              <Input id="tradeName" label="Trade name" {...register("tradeName")} />
              <Input id="email" type="email" label="Business email" required error={errors.email?.message} {...register("email")} />
              <Input id="phone" label="Phone" {...register("phone")} />
              <Input id="country" label="Country" required error={errors.country?.message} {...register("country")} />
              <Input id="city" label="City" {...register("city")} />
              <div className="sm:col-span-2"><Input id="address" label="Address" {...register("address")} /></div>
              <Input id="website" label="Website" {...register("website")} />
              <Input id="taxOrRegNumber" label="Tax / registration number" hint="PAN, VAT or business registration no." {...register("taxOrRegNumber")} />
            </div>

            <div className={step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
              <Input id="adminFirstName" label="First name" required error={errors.adminFirstName?.message} {...register("adminFirstName")} />
              <Input id="adminLastName" label="Last name" required error={errors.adminLastName?.message} {...register("adminLastName")} />
              <Input id="adminEmail" type="email" label="Login email" required error={errors.adminEmail?.message} {...register("adminEmail")} />
              <Input id="adminPassword" type="password" label="Password" required autoComplete="new-password" hint="8+ characters with a letter and a digit" error={errors.adminPassword?.message} {...register("adminPassword")} />
            </div>

            <div className={step === 2 ? "space-y-3" : "hidden"}>
              <p className="text-sm text-gray-600">Upload your business registration, tax certificate and trade license / IATA / TAAN membership. You can also add or replace documents later from your dashboard.</p>
              <KycFilePicker rows={rows} onChange={setRows} disabled={submitting} />
            </div>

            <div className="flex items-center justify-between pt-2">
              {step > 0 ? <Button key="back" type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={submitting}>Back</Button> : <span />}
              {step < STEPS.length - 1 ? (
                <Button key="continue" type="button" onClick={next}>Continue</Button>
              ) : (
                <Button key="submit" type="submit" isLoading={submitting}>Submit application</Button>
              )}
            </div>
          </form>
        </PageCard>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already applied? <Link to={PATHS.LOGIN} className="font-medium text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
