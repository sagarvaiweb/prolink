"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Building2, Globe2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import type { Company, CompanyPayload, CompanySize } from "@/types/company.types";
import { useCreateCompanyMutation, useUpdateCompanyMutation } from "@/redux/features/companies/companiesApi";
import { useAppDispatch } from "@/redux/hooks";
import { setActiveCompany } from "@/redux/features/companies/companiesSlice";

const sizes: CompanySize[] = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100";

interface Props { company?: Company; onSuccess: (companyId: string) => void; }

export default function CompanyForm({ company, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const [createCompany, createState] = useCreateCompanyMutation();
  const [updateCompany, updateState] = useUpdateCompanyMutation();
  const [form, setForm] = useState({
    name: "", logo: "", industry: "", companySize: "" as CompanySize | "",
    location: "", website: "", description: "",
  });

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name, logo: company.logo ?? "", industry: company.industry ?? "",
      companySize: company.companySize ?? "", location: company.location ?? "",
      website: company.website ?? "", description: company.description ?? "",
    });
  }, [company]);

  const isPending = createState.isLoading || updateState.isLoading;
  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CompanyPayload = {
      name: form.name.trim(),
      logo: form.logo.trim() || null,
      industry: form.industry.trim(),
      ...(form.companySize ? { companySize: form.companySize } : {}),
      location: form.location.trim(),
      website: form.website.trim() || null,
      description: form.description.trim(),
    };
    try {
      const response = company
        ? await updateCompany({ companyId: company._id, data: payload }).unwrap()
        : await createCompany(payload).unwrap();
      const id = response.data.company._id;
      dispatch(setActiveCompany(id));
      toast.success(company ? "Company profile updated." : "Company created. It is now awaiting verification.");
      onSuccess(id);
    } catch (error) {
      const message = typeof error === "object" && error && "data" in error
        ? (error as { data?: { message?: string } }).data?.message
        : undefined;
      toast.error(message || "We couldn't save this company. Please check the details and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {!company && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">New company profiles are reviewed by our team. You can complete the profile now; job posting unlocks after verification.</div>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-primary-50 p-2.5 text-primary-800"><Building2 size={19} /></span><div><h2 className="font-semibold text-slate-900">Company identity</h2><p className="text-sm text-slate-500">Help people recognize your organization.</p></div></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Company name <span className="text-red-500">*</span><input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Northstar Labs" className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Industry<input maxLength={100} value={form.industry} onChange={(e) => setField("industry", e.target.value)} placeholder="e.g. Software & technology" className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Company size<select value={form.companySize} onChange={(e) => setField("companySize", e.target.value)} className={inputClass}><option value="">Choose a range</option>{sizes.map((size) => <option key={size} value={size}>{size} employees</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Headquarters location<span className="relative mt-1.5 block"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input maxLength={150} value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="City, country" className={`${inputClass} mt-0 pl-9`} /></span></label>
          <label className="text-sm font-medium text-slate-700">Website<span className="relative mt-1.5 block"><Globe2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="url" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://example.com" className={`${inputClass} mt-0 pl-9`} /></span></label>
          <label className="text-sm font-medium text-slate-700">Logo URL<input type="url" value={form.logo} onChange={(e) => setField("logo", e.target.value)} placeholder="https://example.com/logo.png" className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">About the company<textarea maxLength={1000} rows={5} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Share what your organization does and what makes it a great place to work." className={`${inputClass} resize-y`} /><span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/1000</span></label>
        </div>
      </section>
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" onClick={() => history.back()} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button><button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{isPending ? "Saving…" : company ? "Save changes" : "Create company"}</button></div>
    </form>
  );
}
