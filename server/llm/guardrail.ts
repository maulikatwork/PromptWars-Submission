import type { SentimentResult } from '../types/llm'

export const CRISIS_HELPLINE_BLOCK = `If you're feeling overwhelmed right now, please reach out:
• Tele-MANAS: 14416 (free, 24/7)
• KIRAN Mental Health Helpline: 1800-599-0019 (free, 24/7)
You don't have to face this alone.`

export function replyContainsCrisisNumbers(reply: string): boolean {
  return reply.includes('14416') && reply.includes('1800-599-0019')
}

export function applyDistressGuardrail(params: {
  reply: string
  distressLevel: SentimentResult['distressLevel']
  userId: string
  journalEntryId: string
}): string {
  if (params.distressLevel === 3 && !replyContainsCrisisNumbers(params.reply)) {
    return `${params.reply}\n\n${CRISIS_HELPLINE_BLOCK}`
  }

  if (params.distressLevel === 2) {
    console.log(
      `Moderate distress logged: userId=${params.userId} journalEntryId=${params.journalEntryId}`,
    )
  }

  return params.reply
}
