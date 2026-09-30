import { Check, X, Minus } from "lucide-react";

type Rule = { key: string; label: string; required: boolean; test: (pw: string) => boolean };

// Same floor as the server's own check (password.length < 8 in
// /api/auth/register and /api/account/password) — the other four are purely
// UI-side guidance, not enforced at submit, so tightening/loosening them
// later needs no API change. `required` drives the badge shown per rule.
const RULES: Rule[] = [
  { key: "length", label: "باید حداقل ۸ کاراکتر باشد", required: true, test: (pw) => pw.length >= 8 },
  {
    key: "lower",
    label: "بهتر است حداقل یک حرف کوچک انگلیسی (a-z) داشته باشد",
    required: false,
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    key: "upper",
    label: "بهتر است حداقل یک حرف بزرگ انگلیسی (A-Z) داشته باشد",
    required: false,
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "number",
    label: "بهتر است حداقل یک عدد (0-9) داشته باشد",
    required: false,
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    key: "special",
    label: "بهتر است حداقل یک کاراکتر خاص (!@#$%...) داشته باشد",
    required: false,
    test: (pw) => /[^a-zA-Z0-9]/.test(pw),
  },
];

function strengthOf(metCount: number): { label: string; barClass: string; textClass: string } {
  if (metCount <= 2) return { label: "ضعیف", barClass: "bg-red-500", textClass: "text-red-400" };
  if (metCount <= 4) return { label: "متوسط", barClass: "bg-amber-500", textClass: "text-amber-400" };
  return { label: "قوی", barClass: "bg-emerald-500", textClass: "text-emerald-400" };
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const metCount = RULES.filter((r) => r.test(password)).length;
  const strength = strengthOf(metCount);
  const started = password.length > 0;

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${started ? strength.barClass : ""}`}
            style={{ width: started ? `${(metCount / RULES.length) * 100}%` : "0%" }}
          />
        </div>
        <span className={`w-10 shrink-0 text-xs font-semibold ${started ? strength.textClass : "text-foreground/30"}`}>
          {started ? strength.label : ""}
        </span>
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {RULES.map((rule) => {
          const met = rule.test(password);
          const violated = started && !met;
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                met ? "text-emerald-400" : violated ? "text-red-400" : "text-foreground/40"
              }`}
            >
              {met ? (
                <Check className="size-3.5 shrink-0" />
              ) : violated ? (
                <X className="size-3.5 shrink-0" />
              ) : (
                <Minus className="size-3.5 shrink-0" />
              )}
              <span>{rule.label}</span>
              <span
                className={`ms-auto inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  rule.required ? "bg-red-500/10 text-red-500" : "bg-foreground/10 text-foreground/50"
                }`}
              >
                {rule.required ? "اجباری" : "اختیاری"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
