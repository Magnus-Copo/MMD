"use client"

import { useState, useTransition } from "react"
import { submitApplicationAction } from "@/lib/actions/module5-automation"

interface Field {
  name: string
  label: string
  type: string
  required?: boolean
  pattern?: string
  maxSizeMB?: number
  accept?: string[]
  placeholder?: string
  min?: number
  max?: number
}

interface PublicApplicationFormProps {
  slug: string
  formId: string
  formFields: Field[]
  requirement: {
    jobTitle: string
    skills: string[]
    experienceMin: number
    experienceMax: number
    location: string
    workMode: string
  }
}

export function PublicApplicationForm({ slug, formFields, requirement }: Readonly<PublicApplicationFormProps>) {
  const [state, setState] = useState<Record<string, any>>({})
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    startTransition(async () => {
      const payload: Record<string, any> = { slug }
      formFields.forEach((f) => {
        payload[f.name] = state[f.name]
      })
      const result = await submitApplicationAction({
        slug,
        name: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        resumeUrl: payload.resume,
        skills: payload.skills ? String(payload.skills).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        college: payload.organization,
        yearsExperience: payload.experience ? Number(payload.experience) : undefined,
      })
      if (!result.success) {
        setError(result.error || "Submission failed")
        return
      }
      setSuccess("Application submitted!")
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 text-white rounded-lg border border-slate-800 p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-cyan-400">Apply to</p>
        <h1 className="text-2xl font-semibold">{requirement.jobTitle}</h1>
        <p className="text-sm text-slate-300">{requirement.location} • {requirement.workMode}</p>
      </div>

      <div className="h-2 w-full bg-slate-800 rounded">
        <div className="h-2 w-1/3 bg-primary rounded" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {formFields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-sm text-slate-200">
              {field.label}
              {field.required && <span className="text-cyan-400 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'file' ? 'text' : field.type}
              placeholder={field.placeholder}
              required={field.required}
              pattern={field.pattern}
              min={field.min}
              max={field.max}
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              onChange={(e) => setState((prev) => ({ ...prev, [field.name]: e.target.value }))}
            />
            {field.type === 'file' && (
              <p className="text-xs text-slate-400">Upload URL (pdf/doc/docx, max {field.maxSizeMB}MB)</p>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">{success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 rounded bg-[#6366F1] hover:bg-[#4f46e5] text-white font-medium disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  )
}
