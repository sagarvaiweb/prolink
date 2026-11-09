"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Building2, Globe2, ImagePlus, MapPin, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Company, CompanyPayload, CompanySize } from "@/types/company.types";
import { useCreateCompanyMutation, useUpdateCompanyMutation } from "@/redux/features/companies/companiesApi";
import { useAppDispatch } from "@/redux/hooks";
import { setActiveCompany } from "@/redux/features/companies/companiesSlice";

const sizes: CompanySize[] = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100";
const maxLogoBytes = 2 * 1024 * 1024;
const acceptedLogoTypes = ["image/jpeg", "image/png"];

interface Props {
  company?: Company;
  onSuccess: (companyId: string) => void;
}

export default function CompanyForm({ company, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [createCompany, createState] = useCreateCompanyMutation();
  const [updateCompany, updateState] = useUpdateCompanyMutation();
  const [form, setForm] = useState({
    name: "", industry: "", companySize: "" as CompanySize | "",
    location: "", website: "", description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name, industry: company.industry ?? "",
      companySize: company.companySize ?? "", location: company.location ?? "",
      website: company.website ?? "", description: company.description ?? "",
    });
    setLogoPreview(company.logo);
  }, [company]);

  useEffect(() => {
    if (!logoFile) return;
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const isPending = createState.isLoading || updateState.isLoading;
  const setField = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!acceptedLogoTypes.includes(file.type)) {
      toast.error("Choose a JPG or PNG image for the company logo.");
      return;
    }
    if (file.size > maxLogoBytes) {
      toast.error("Company logos must be 2 MB or smaller.");
      return;
    }

    setLogoFile(file);
    setRemoveLogo(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CompanyPayload = {
      name: form.name.trim(),
      logo: removeLogo ? null : company?.logo ?? null,
      industry: form.industry.trim(),
      ...(form.companySize ? { companySize: form.companySize } : {}),
      location: form.location.trim(),
      website: form.website.trim() || null,
      description: form.description.trim(),
    };
    const data: CompanyPayload | FormData = logoFile
      ? (() => {
          const multipart = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (key === "logo" || value === undefined) return;
            multipart.append(key, value === null ? "" : String(value));
          });
          multipart.append("logo", logoFile);
          return multipart;
        })()
      : payload;

    try {
      const response = company
        ? await updateCompany({ companyId: company._id, data }).unwrap()
        : await createCompany(data).unwrap();
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

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {!company && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">New company profiles are reviewed by our team. You can complete the profile now; job posting unlocks after verification.</div>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-primary-50 p-2.5 text-primary-800"><Building2 size={19} /></span><div><h2 className="font-semibold text-slate-900">Company identity</h2><p className="text-sm text-slate-500">Help people recognize your organization.</p></div></div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {logoPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
                : <ImagePlus size={28} className="text-slate-400" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Company logo</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">Upload a clear square logo from your device. JPG or PNG, up to 2 MB.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary-800 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:opacity-60"><Upload size={15} />{logoPreview ? "Choose another" : "Upload logo"}</button>
                {logoPreview && <button type="button" onClick={clearLogo} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"><Trash2 size={15} />Remove</button>}
              </div>
              {logoFile && <p className="mt-2 truncate text-xs text-slate-500" title={logoFile.name}>{logoFile.name} · {(logoFile.size / 1024).toFixed(0)} KB</p>}
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png" onChange={chooseLogo} className="sr-only" aria-label="Choose a company logo image" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Company name <span className="text-red-500">*</span><input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Northstar Labs" className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Industry<input maxLength={100} value={form.industry} onChange={(e) => setField("industry", e.target.value)} placeholder="e.g. Software & technology" className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Company size<select value={form.companySize} onChange={(e) => setField("companySize", e.target.value)} className={inputClass}><option value="">Choose a range</option>{sizes.map((size) => <option key={size} value={size}>{size} employees</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Headquarters location<span className="relative mt-1.5 block"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input maxLength={150} value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="City, country" className={`${inputClass} mt-0 pl-9`} /></span></label>
          <label className="text-sm font-medium text-slate-700">Website<span className="relative mt-1.5 block"><Globe2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="url" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://example.com" className={`${inputClass} mt-0 pl-9`} /></span></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">About the company<textarea maxLength={1000} rows={5} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Share what your organization does and what makes it a great place to work." className={`${inputClass} resize-y`} /><span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/1000</span></label>
        </div>
      </section>
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" onClick={() => history.back()} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button><button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{isPending ? "Saving…" : company ? "Save changes" : "Create company"}</button></div>
    </form>
  );
}
