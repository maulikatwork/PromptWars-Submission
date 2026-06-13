import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { Journal } from '../models/Journal'
import type { ConversationMessage, SentimentResult } from '../types/llm'
import { deepseek } from './deepseekClient'
import { buildPersonaSystemPrompt, EXTRACTOR_SYSTEM_PROMPT } from './prompts'
import { parseSentimentResult } from './sentiment'

export interface ProcessJournalEntryParams {
  journalEntryId: string
  rawText: string
  studentName: string
  examType: string
  targetDate: string | null
  conversationHistory: ConversationMessage[]
}

export interface ProcessJournalEntryResult {
  companionReply: string
  sentiment: SentimentResult
}

function buildPersonaMessages(
  conversationHistory: ConversationMessage[],
  rawText: string,
): ChatCompletionMessageParam[] {
  const historyMessages: ChatCompletionMessageParam[] = conversationHistory.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  return [...historyMessages, { role: 'user', content: rawText }]
}

export async function processJournalEntry(
  params: ProcessJournalEntryParams,
): Promise<ProcessJournalEntryResult> {
  const personaSystemPrompt = buildPersonaSystemPrompt({
    studentName: params.studentName,
    examType: params.examType,
    targetDate: params.targetDate,
  })

  const personaMessages = buildPersonaMessages(params.conversationHistory, params.rawText)

  console.time('deepseek-parallel')

  const [personaResponse, extractorResponse] = await Promise.all([
    deepseek.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.75,
      max_tokens: 500,
      messages: [{ role: 'system', content: personaSystemPrompt }, ...personaMessages],
    }),
    deepseek.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.1,
      max_tokens: 200,
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        { role: 'user', content: params.rawText },
      ],
    }),
  ])

  console.timeEnd('deepseek-parallel')

  const companionReply = personaResponse.choices[0]?.message?.content?.trim() ?? ''
  const extractorContent = extractorResponse.choices[0]?.message?.content ?? ''
  const sentiment = parseSentimentResult(extractorContent)

  await Journal.findByIdAndUpdate(params.journalEntryId, {
    sentimentScore: sentiment.sentimentScore,
    emotionalThemes: sentiment.emotionalThemes,
    triggers: sentiment.triggers,
    distressLevel: sentiment.distressLevel,
  })

  return { companionReply, sentiment }
}
