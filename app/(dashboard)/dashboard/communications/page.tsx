'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { MessageSquare, RefreshCw, Send, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import {
  closeThreadAction,
  createThreadAction,
  listThreadMessagesAction,
  postMessageAction,
} from '@/lib/actions/module10-communication'

interface CommunicationThread {
  id: string
  subject: string
  entityType: 'Company' | 'Requirement' | 'Candidate' | 'Placement'
  entityId: string
  isClosed: boolean
  participants: string[]
  lastMessageAt?: string
}

interface CommunicationMessage {
  id: string
  channel: string
  direction: string
  body: string
  senderId?: string
  createdAt?: string
}

interface ThreadFormState {
  entityType: 'Company' | 'Requirement' | 'Candidate' | 'Placement'
  entityId: string
  subject: string
  participantIds: string
}

interface MessageFormState {
  threadId: string
  channel: 'EMAIL' | 'WHATSAPP' | 'CALL' | 'NOTE'
  direction: 'INBOUND' | 'OUTBOUND'
  body: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeThread(value: unknown): CommunicationThread | null {
  const record = asRecord(value)
  if (!record) return null

  const id = asString(record._id) || asString(record.id)
  if (!id) return null

  return {
    id,
    subject: asString(record.subject) || 'Untitled thread',
    entityType: (asString(record.entityType) as CommunicationThread['entityType']) || 'Requirement',
    entityId: asString(record.entityId),
    isClosed: Boolean(record.isClosed),
    participants: Array.isArray(record.participants)
      ? record.participants.filter((item): item is string => typeof item === 'string')
      : [],
    lastMessageAt: asString(record.lastMessageAt) || undefined,
  }
}

function normalizeMessages(value: unknown): CommunicationMessage[] {
  if (!Array.isArray(value)) return []

  const items: CommunicationMessage[] = []
  for (const item of value) {
    const record = asRecord(item)
    if (!record) continue

    const id = asString(record._id) || asString(record.id)
    if (!id) continue

    items.push({
      id,
      channel: asString(record.channel) || 'NOTE',
      direction: asString(record.direction) || 'OUTBOUND',
      body: asString(record.body),
      senderId: asString(record.senderId) || undefined,
      createdAt: asString(record.createdAt) || undefined,
    })
  }

  return items
}

const initialThreadForm: ThreadFormState = {
  entityType: 'Requirement',
  entityId: '',
  subject: '',
  participantIds: '',
}

const initialMessageForm: MessageFormState = {
  threadId: '',
  channel: 'NOTE',
  direction: 'OUTBOUND',
  body: '',
}

export default function CommunicationsPage() {
  const { data: session, status } = useSession()
  const toast = useToast()

  const [isCreatingThread, setIsCreatingThread] = useState(false)
  const [isPostingMessage, setIsPostingMessage] = useState(false)
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [isClosingThread, setIsClosingThread] = useState(false)

  const [threadForm, setThreadForm] = useState<ThreadFormState>(initialThreadForm)
  const [messageForm, setMessageForm] = useState<MessageFormState>(initialMessageForm)
  const [loadedThread, setLoadedThread] = useState<CommunicationThread | null>(null)
  const [messages, setMessages] = useState<CommunicationMessage[]>([])

  const role = session?.user?.role || 'RECRUITER'
  const isAllowed = role !== 'SCRAPER'

  const loadThread = async (threadId: string) => {
    if (!threadId.trim()) {
      toast.error('Thread ID required', 'Provide a valid thread ID to load messages')
      return
    }

    setIsLoadingThread(true)
    try {
      const response = await listThreadMessagesAction({ threadId: threadId.trim() })
      if (!response.success || !response.data) {
        toast.error('Thread load failed', response.error || 'Could not fetch thread details')
        return
      }

      const payload = asRecord(response.data)
      const thread = normalizeThread(payload?.thread)
      const threadMessages = normalizeMessages(payload?.messages)
      if (!thread) {
        toast.error('Thread load failed', 'Thread payload is malformed')
        return
      }

      setLoadedThread(thread)
      setMessages(threadMessages)
      setMessageForm((prev) => ({ ...prev, threadId: thread.id }))
    } catch {
      toast.error('Thread load failed', 'Unexpected error while loading communication thread')
    } finally {
      setIsLoadingThread(false)
    }
  }

  const handleCreateThread = async () => {
    if (!threadForm.entityId.trim() || !threadForm.subject.trim()) {
      toast.error('Missing details', 'Entity ID and subject are required to create a thread')
      return
    }

    setIsCreatingThread(true)
    try {
      const participantIds = threadForm.participantIds
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const response = await createThreadAction({
        entityType: threadForm.entityType,
        entityId: threadForm.entityId.trim(),
        subject: threadForm.subject.trim(),
        participantIds,
      })

      if (!response.success || !response.data) {
        toast.error('Thread creation failed', response.error || 'Unable to create communication thread')
        return
      }

      const thread = normalizeThread(response.data)
      if (!thread) {
        toast.error('Thread creation failed', 'Created thread payload is invalid')
        return
      }

      toast.success('Thread created', `Thread ${thread.id} is ready for messages`)
      setLoadedThread(thread)
      setMessages([])
      setThreadForm(initialThreadForm)
      setMessageForm((prev) => ({ ...prev, threadId: thread.id }))
    } catch {
      toast.error('Thread creation failed', 'Unexpected error while creating thread')
    } finally {
      setIsCreatingThread(false)
    }
  }

  const handlePostMessage = async () => {
    if (!messageForm.threadId.trim() || !messageForm.body.trim()) {
      toast.error('Missing details', 'Thread ID and message body are required')
      return
    }

    setIsPostingMessage(true)
    try {
      const response = await postMessageAction({
        threadId: messageForm.threadId.trim(),
        channel: messageForm.channel,
        direction: messageForm.direction,
        body: messageForm.body.trim(),
      })

      if (!response.success || !response.data) {
        toast.error('Message send failed', response.error || 'Could not send communication message')
        return
      }

      toast.success('Message posted', 'Communication thread has been updated')
      setMessageForm((prev) => ({ ...prev, body: '' }))
      await loadThread(messageForm.threadId)
    } catch {
      toast.error('Message send failed', 'Unexpected error while posting message')
    } finally {
      setIsPostingMessage(false)
    }
  }

  const handleCloseThread = async () => {
    if (!loadedThread) return

    setIsClosingThread(true)
    try {
      const response = await closeThreadAction({ threadId: loadedThread.id })
      if (!response.success || !response.data) {
        toast.error('Close thread failed', response.error || 'Could not close communication thread')
        return
      }

      const closedThread = normalizeThread(response.data)
      if (closedThread) {
        setLoadedThread(closedThread)
      }
      toast.success('Thread closed', 'No more messages can be posted to this thread')
    } catch {
      toast.error('Close thread failed', 'Unexpected error while closing thread')
    } finally {
      setIsClosingThread(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Communications</h1>
        <p className="text-[var(--foreground-muted)]">Loading communication workspace...</p>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h1 className="text-xl font-semibold">Communications Restricted</h1>
        <p className="mt-2 text-sm">Scraper accounts do not have access to communication threads.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Communications</h1>
        <p className="text-[var(--foreground-muted)]">Create collaboration threads, post updates, and manage thread lifecycle.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Thread</h2>
          </div>

          <Select
            label="Entity Type"
            value={threadForm.entityType}
            onChange={(event) => setThreadForm((prev) => ({ ...prev, entityType: event.target.value as ThreadFormState['entityType'] }))}
            options={[
              { label: 'Requirement', value: 'Requirement' },
              { label: 'Company', value: 'Company' },
              { label: 'Candidate', value: 'Candidate' },
              { label: 'Placement', value: 'Placement' },
            ]}
          />

          <Input
            label="Entity ID"
            placeholder="Mongo Object ID"
            value={threadForm.entityId}
            onChange={(event) => setThreadForm((prev) => ({ ...prev, entityId: event.target.value }))}
          />

          <Input
            label="Subject"
            placeholder="Thread subject"
            value={threadForm.subject}
            onChange={(event) => setThreadForm((prev) => ({ ...prev, subject: event.target.value }))}
          />

          <Input
            label="Participants (optional)"
            placeholder="userId1, userId2"
            value={threadForm.participantIds}
            onChange={(event) => setThreadForm((prev) => ({ ...prev, participantIds: event.target.value }))}
          />

          <Button
            leftIcon={<MessageSquare className="h-4 w-4" />}
            isLoading={isCreatingThread}
            loadingText="Creating..."
            onClick={handleCreateThread}
          >
            Create Thread
          </Button>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Post Message</h2>
          </div>

          <Input
            label="Thread ID"
            placeholder="Thread ID"
            value={messageForm.threadId}
            onChange={(event) => setMessageForm((prev) => ({ ...prev, threadId: event.target.value }))}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Channel"
              value={messageForm.channel}
              onChange={(event) => setMessageForm((prev) => ({ ...prev, channel: event.target.value as MessageFormState['channel'] }))}
              options={[
                { label: 'Note', value: 'NOTE' },
                { label: 'Email', value: 'EMAIL' },
                { label: 'WhatsApp', value: 'WHATSAPP' },
                { label: 'Call', value: 'CALL' },
              ]}
            />

            <Select
              label="Direction"
              value={messageForm.direction}
              onChange={(event) => setMessageForm((prev) => ({ ...prev, direction: event.target.value as MessageFormState['direction'] }))}
              options={[
                { label: 'Outbound', value: 'OUTBOUND' },
                { label: 'Inbound', value: 'INBOUND' },
              ]}
            />
          </div>

          <Textarea
            label="Message"
            rows={4}
            placeholder="Write your update"
            value={messageForm.body}
            onChange={(event) => setMessageForm((prev) => ({ ...prev, body: event.target.value }))}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              leftIcon={<Send className="h-4 w-4" />}
              isLoading={isPostingMessage}
              loadingText="Posting..."
              onClick={handlePostMessage}
            >
              Post Message
            </Button>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              isLoading={isLoadingThread}
              loadingText="Loading..."
              onClick={() => loadThread(messageForm.threadId)}
            >
              Load Thread
            </Button>
            <Button
              variant="ghost"
              leftIcon={<XCircle className="h-4 w-4" />}
              isLoading={isClosingThread}
              loadingText="Closing..."
              onClick={handleCloseThread}
              disabled={!loadedThread || loadedThread.isClosed}
            >
              Close Thread
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Thread Activity</h2>

        {loadedThread ? (
          <div className="rounded-lg border border-[var(--border)] p-4">
            <p className="font-medium text-[var(--foreground)]">{loadedThread.subject}</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              {loadedThread.entityType} • {loadedThread.entityId} • {loadedThread.isClosed ? 'Closed' : 'Open'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--foreground-muted)]">No thread loaded yet.</p>
        )}

        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-[var(--foreground-muted)]">No messages for this thread.</p>
          )}

          {messages.map((message) => (
            <article key={message.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)]">
                <span>{message.channel}</span>
                <span>•</span>
                <span>{message.direction}</span>
                {message.createdAt && (
                  <>
                    <span>•</span>
                    <span>{format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--foreground)] whitespace-pre-wrap">{message.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
