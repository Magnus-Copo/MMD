"use client"

import { useState, useTransition } from "react"
import { regenerateContentAction } from "@/lib/actions/module5-automation"

const tabs = [
  { key: "form", label: "Application Form" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "linkedIn", label: "LinkedIn" },
] as const

type TabKey = (typeof tabs)[number]["key"]

interface AutomationPanelProps {
  requirementId: string
  formUrl?: string
  content: {
    whatsapp?: string | null
    email?: string | null
    linkedIn?: string | null
  }
}

export function AutomationPanel({ requirementId, formUrl, content }: Readonly<AutomationPanelProps>) {
  const [active, setActive] = useState<TabKey>("form")
  const [draft, setDraft] = useState({
    whatsapp: content.whatsapp ?? "",
    email: content.email ?? "",
    linkedIn: content.linkedIn ?? "",
  })
  const [message, setMessage] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const onRegenerate = (type: "whatsapp" | "email" | "linkedIn") => {
    startTransition(async () => {
      setMessage("")
      try {
        const result = await regenerateContentAction({ requirementId, type })
        if (!result?.success || !result.data) {
          setMessage(result?.error || "Failed to regenerate")
          return
        }
        const data = result.data as { content: string }
        if (!data.content) {
          setMessage("Failed to regenerate")
          return
        }
        setDraft((prev) => ({ ...prev, [type]: data.content }))
        setMessage(`${type} regenerated`)
      } catch (error) {
        console.error("Regenerate content failed", error)
        setMessage("Failed to regenerate")
      }
    })
  }

  const copy = async (text: string) => {
    if (!text) {
      setMessage("Nothing to copy")
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setMessage("Copied to clipboard")
    } catch (e) {
      console.error("Copy failed", e)
      setMessage("Copy failed")
    }
  }

  const renderContent = () => {
    if (active === "form") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Shareable URL</span>
            {formUrl ? (
              <code className="px-2 py-1 rounded bg-muted text-xs font-mono flex-1 truncate">{formUrl}</code>
            ) : (
              <span className="text-xs text-destructive">Form not generated</span>
            )}
            {formUrl && (
              <button
                className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:opacity-90"
                onClick={() => copy(formUrl)}
              >
                Copy Link
              </button>
            )}
          </div>
          <p className="text-xs text-cyan-400">Auto-generated</p>
        </div>
      )
    }

    const value = draft[active]
    const label = tabs.find((t) => t.key === active)?.label ?? active

    return (
      <div className="space-y-3">
        <label className="text-sm text-muted-foreground" htmlFor={`automation-${active}`}>
          {label}
        </label>
        <textarea
          id={`automation-${active}`}
          className="w-full min-h-[200px] rounded border border-border bg-input px-3 py-2 text-sm"
          value={value}
          placeholder={`Auto-generated ${label} content`}
          onChange={(e) => setDraft((prev) => ({ ...prev, [active]: e.target.value }))}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onRegenerate(active as any)}
            className="rounded bg-primary px-3 py-2 text-white text-sm hover:opacity-90 disabled:opacity-50"
          >
            Regenerate {label}
          </button>
          <button
            type="button"
            onClick={() => value && copy(value)}
            className="rounded bg-emerald-600 px-3 py-2 text-white text-sm hover:opacity-90"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-cyan-400">Auto-generated</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 text-white p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-3 py-2 rounded-md text-sm ${active === tab.key ? "bg-primary text-white" : "bg-slate-800 text-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderContent()}
      {message && <p className="text-xs text-emerald-400">{message}</p>}
    </div>
  )
}
