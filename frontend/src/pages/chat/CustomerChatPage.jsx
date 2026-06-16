import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, MessageSquareText, Send, Sparkles, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { chatApi } from '../../services/api'

const samplePrompts = [
  'What does a fraud score of 85 mean?',
  'How do I analyze transaction TXN20240101001?',
  'What should I do for a high-risk transaction?',
  'Explain AML and SAR briefly.'
]

export default function CustomerChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your customer support assistant for FraudGuard. I can answer fraud questions, explain risk scores, and help you understand flagged transactions.',
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [mode, setMode] = useState('auto')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await chatApi.history(20)
        if (data?.length) {
          const historyMessages = data.flatMap(item => [
            { id: `${item.id}-user`, role: 'user', text: item.message, timestamp: item.timestamp },
            { id: `${item.id}-assistant`, role: 'assistant', text: item.response, timestamp: item.timestamp }
          ])

          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              text: 'Hello! I am your customer support assistant for FraudGuard. I can answer fraud questions, explain risk scores, and help you understand flagged transactions.',
              timestamp: new Date().toISOString()
            },
            ...historyMessages
          ])
        }
      } catch (error) {
        console.error('Failed to load chat history', error)
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [])

  const handleSend = async (messageText = input.trim()) => {
    if (!messageText) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: messageText,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const request = mode === 'auto' ? chatApi.auto(messageText) : chatApi.send(messageText)
      const { data } = await request
      setMessages(prev => [
        ...prev,
        {
          id: data.id || crypto.randomUUID(),
          role: 'assistant',
          text: data.response,
          timestamp: data.timestamp || new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Chat send failed', error)
      toast.error('Unable to send your message right now. Please try again.')
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    try {
      await chatApi.clear()
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: 'Chat history cleared. Ask me anything else about fraud alerts or transaction safety.',
          timestamp: new Date().toISOString()
        }
      ])
      toast.success('Chat history cleared')
    } catch (error) {
      console.error('Clear history failed', error)
      toast.error('Unable to clear history right now.')
    }
  }

  const quickActions = useMemo(() => samplePrompts, [])

  return (
    <div className="space-y-6 p-1 md:p-2">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">Customer Chat</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">AI chatbot for customer support</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Help customers ask about transactions, understand risk, and get quick guidance without leaving the fraud portal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <Trash2 size={16} />
          Clear chat
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Live chat</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Responses are generated using the existing fraud assistant engine.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mode === 'auto' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
              >
                Auto mode
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${mode === 'manual' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
              >
                Manual mode
              </button>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Online</div>
            </div>
          </div>

          <div className="h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            {historyLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Loading chat history...
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <article
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                        <Bot size={16} />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'}`}>
                      <p className="whitespace-pre-wrap leading-6">{msg.text}</p>
                      <p className={`mt-2 text-[11px] ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))}

                {loading && (
                  <article className="flex gap-3 justify-start">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                      <Bot size={16} />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                        <Loader2 size={14} className="animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  </article>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a question like: Why was TXN20240101001 flagged?"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Sparkles size={16} className="text-blue-600" />
              Suggested questions
            </div>
            <div className="mt-4 space-y-2">
              {quickActions.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSend(item)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-blue-500/40 dark:hover:bg-slate-700"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <MessageSquareText size={16} className="text-blue-600" />
              What this chatbot can do
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>• Answer customer questions about fraud risk and flagged transactions.</li>
              <li>• Explain risk scores and recommended next steps for support teams.</li>
              <li>• Provide quick explanations of AML, KYC, SAR, and chargebacks.</li>
              <li>• Connect the assistant with APIs, Twilio alerts, and future multimodal document analysis.</li>
              <li>• Show how LangChain-style prompt workflows can power a modern AI fraud assistant.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
