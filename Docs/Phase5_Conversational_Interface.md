# Phase 5 — Conversational Interface

> **Status:** Not Started
> **Depends On:** Phase 4 complete (full backend pipeline working end-to-end)
> **Exit Criteria:** A student can hold a full journaling conversation end-to-end in the browser — text and voice input both work, mobile-first layout verified at 375px, 768px, and 1280px.

---

## Objective

Build the complete frontend: landing page, onboarding flow, and the journal chat interface. Mobile-first, calm, minimal, accessible. Voice input uses the browser-native Speech Recognition API — no library, no external service.

---

## Design Principles

| Principle | Rule |
|---|---|
| Calm first | Muted sage primary, warm grey neutrals — no high-saturation colours |
| Low cognitive load | `max-w-2xl` content width, `text-base` (16px) minimum, generous whitespace |
| Mobile first | Base styles for 375px; add `sm:`, `md:`, `lg:` modifiers to enhance |
| One action at a time | One primary CTA per screen; secondary actions visually recessive |
| Light theme only | No dark mode — keeps implementation simple and readable consistent |

---

## Scope

### 5.1 Landing Page — `src/pages/LandingPage.tsx`

Complete the Phase 1 shell.

**Layout (single column, mobile-first):**

```
max-w-2xl mx-auto px-4 py-8
│
├── <header>  App name + tagline
│
├── <section aria-label="About this companion">
│     What it is / what it is NOT (not a therapist)
│
├── <section aria-label="Privacy">
│     bg-primary-50 card — anonymous, no account needed
│
├── <section aria-label="Crisis Resources">
│     bg-primary-50 card — Tele-MANAS 14416 · KIRAN 1800-599-0019
│
└── "Get Started →" CTA button → /journal
```

Styles:
- App name: `text-2xl font-semibold text-neutral-800`.
- Tagline: `text-lg text-neutral-600 font-normal`.
- Body: `text-base text-neutral-700 leading-relaxed`.
- Info cards: `bg-primary-50 border border-primary-200 rounded-xl p-4`.
- CTA: `bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-xl min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.

---

### 5.2 Onboarding Modal — `src/components/OnboardingModal.tsx`

Complete the Phase 1 shell. Shown when `localStorage` has no `user_profile`.

```
role="dialog" aria-modal="true" aria-labelledby="onboarding-title"
Fixed backdrop: bg-black/30
Panel: bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4
```

Fields:
- **Name** — `<label htmlFor="name">` + `<input id="name" type="text" maxLength={60}>`.
- **Exam** — `<label htmlFor="exam">` + `<select id="exam">` with JEE/NEET/CUET/CAT/GATE/UPSC/Other options.
- **Target date** — `<label htmlFor="targetDate">` + `<input id="targetDate" type="date">` (optional).

Rules:
- Submit button disabled until `name` and `exam` are filled.
- Focus trapped inside modal while open — `useEffect` focuses first input on mount.
- Validation errors shown as `<span role="alert">` below the offending field.
- On submit: `POST /api/users`, save to `localStorage`, close modal.
- Privacy note inside modal: "Your data is stored anonymously. No account needed."

---

### 5.3 Journal Chat Interface — `src/pages/JournalPage.tsx`

#### Overall Layout (full viewport height)

```
display: flex; flex-direction: column; height: 100dvh
│
├── <StickyHeader />          sticky top-0, h-14
│
├── <main>                    flex-1, overflow-y-auto
│     message list            flex flex-col gap-4 px-4 py-4
│     <ThinkingIndicator />   shown when isLoading
│
└── CrisisBanner (if needed)  above input bar
    <InputBar />              sticky bottom-0
```

Desktop (`lg:`): centre content with `max-w-2xl mx-auto` applied to the inner column.

---

#### Sticky Header — `src/components/StickyHeader.tsx`

- `sticky top-0 z-10 bg-white border-b border-neutral-200 h-14 flex items-center px-4 justify-between`.
- Left: app name.
- Right: student name from `UserContext` + icon link to `/dashboard` (added Phase 6).

---

#### Message Bubbles — `src/components/MessageBubble.tsx`

- AI reply: `bg-primary-50 text-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] self-start animate-fadeInUp`.
- User message: `bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] self-end animate-fadeInUp`.
- Timestamp: `text-xs text-neutral-400 mt-1`.
- Keys: stable UUID per message — never array index.

---

#### Thinking Indicator — `src/components/ThinkingIndicator.tsx`

Three staggered bouncing dots while `isLoading === true`:
- `<div aria-live="polite" aria-label="AI is responding">`.
- Dots: `bg-neutral-300 rounded-full w-2 h-2 animate-bounce` with staggered `animation-delay`.

---

#### Input Bar — `src/components/InputBar.tsx`

```
sticky bottom-0 bg-white border-t border-neutral-200
px-4 py-3 pb-[env(safe-area-inset-bottom)]
flex items-center gap-2
```

- `<label htmlFor="journal-input" className="sr-only">Journal message</label>`.
- `<textarea id="journal-input">` — auto-resizes to max 5 rows; `text-base` (16px) prevents iOS Safari zoom; `rows={1}` default.
- **Send button**: icon-only on mobile, `aria-label="Send message"`, disabled when empty or `isLoading`.
- **Mic button**: see 5.4. Hidden entirely if Speech Recognition unsupported.

---

### 5.4 Voice Input — `src/hooks/useSpeechRecognition.ts`

Browser-native Web Speech API only. No external library or service.

```ts
export function useSpeechRecognition(onTranscript: (text: string) => void): {
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
}
```

Implementation:
- Feature detect: `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window` — set `isSupported: false` if absent. The mic button is hidden (not just disabled) when unsupported.
- `recognition.lang = 'en-IN'` (Indian English accent — improves accuracy for target users).
- `recognition.interimResults = false` — only final results call `onTranscript`.
- `recognition.continuous = false` — one utterance per tap.
- `onresult`: `onTranscript(event.results[0][0].transcript)` — appended to textarea value with a space separator in the component.
- `onerror`: display `<span role="alert">"Microphone unavailable — please type instead."` — never fail silently.
- Stop recognition on component unmount.

**Mic button states:**
- Idle: mic icon, `aria-label="Start voice input"`, `min-h-[44px] min-w-[44px]`.
- Recording: stop icon, `aria-label="Stop voice input"`, `ring-2 ring-red-400 animate-pulse`.
- Always: visible `focus-visible` ring.

---

### 5.5 Crisis Banner — `src/components/CrisisBanner.tsx`

Shown above `<InputBar />` when API returns `distressLevel >= 2`.

- `role="alert"` — announced immediately by screen readers.
- `distressLevel === 2`: dismissible `[✕]` button (`aria-label="Dismiss"`). Style: `bg-accent-100 border-accent-300`.
- `distressLevel === 3`: not dismissible. Style: `bg-amber-100 border-amber-300`.
- Content: "💛 You're not alone. Tele-MANAS: 14416 · KIRAN: 1800-599-0019 (free, 24/7)".

---

### 5.6 Opening Greeting

On mount of `<JournalPage />` (no messages in state), inject a synthetic assistant message — no API call:

```
"Hi {{name}}! I'm here to listen — how are you feeling about your {{exam}} prep today?"
```

Populated from `localStorage`'s `user_profile`. Displayed as an assistant bubble.

---

### 5.7 State & Types

```ts
// src/types/messages.ts
export type Message = {
  id: string           // crypto.randomUUID()
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
```

In `<JournalPage />`:
```ts
const [messages, setMessages]           = useState<Message[]>([openingMessage])
const [inputText, setInputText]         = useState('')
const [isLoading, setIsLoading]         = useState(false)
const [distressLevel, setDistressLevel] = useState<0|1|2|3>(0)
const [isBannerDismissed, setIsBannerDismissed] = useState(false)
```

`useState` and `useContext` only — no external state library.

---

### 5.8 API Wrapper — `src/api/chatApi.ts`

```ts
export async function sendMessage(rawText: string, userId: string): Promise<{
  reply: string
  entryId: string
  distressLevel: 0 | 1 | 2 | 3
}>
```

Throws a typed error on non-2xx — caught in the component and shown as an inline error message with `role="alert"`.

---

## File Structure After Phase 5

```
src/
├── api/chatApi.ts
├── components/
│   ├── CrisisBanner.tsx
│   ├── InputBar.tsx
│   ├── MessageBubble.tsx
│   ├── OnboardingModal.tsx   ← COMPLETE
│   ├── StickyHeader.tsx
│   └── ThinkingIndicator.tsx
├── context/UserContext.tsx
├── hooks/useSpeechRecognition.ts
├── pages/
│   ├── LandingPage.tsx       ← COMPLETE
│   └── JournalPage.tsx       ← COMPLETE
├── types/messages.ts
├── App.tsx
├── index.css
└── main.tsx
```

---

## Acceptance Criteria

- [ ] Landing page renders correctly at 375px, 768px, and 1280px.
- [ ] Onboarding modal appears on first `/journal` visit; skips on return.
- [ ] Onboarding rejects empty name — shows inline error.
- [ ] Opening greeting appears as an assistant bubble after onboarding.
- [ ] Sending a message calls `POST /api/chat` and displays the AI reply.
- [ ] `isLoading` shows the thinking indicator and disables Send.
- [ ] Mic button is hidden in browsers without `SpeechRecognition`.
- [ ] In a supported browser, voice transcript appends to the textarea.
- [ ] `distressLevel >= 2` shows the crisis banner.
- [ ] All interactive elements reachable by keyboard.
- [ ] All inputs have `<label>` via `htmlFor`/`id`.
- [ ] No `<img>` without `alt`.

---

## CLAUDE.md Checklist

- Mobile-first CSS — base for 375px, then `sm:`, `md:`, `lg:`.
- No `outline-none` without a visible focus-visible ring.
- `SpeechRecognition` feature-detected — mic button absent when unsupported.
- `<label>` via `htmlFor`/`id` on every input — never placeholder only.
- Message keys are stable UUIDs — not array indices.
- `useState`/`useContext` only — no external state library.
- `min-h-[44px]` on every tap target.
- `text-base` (16px) on textarea — prevents iOS Safari zoom.
- `pb-[env(safe-area-inset-bottom)]` on sticky input bar.
