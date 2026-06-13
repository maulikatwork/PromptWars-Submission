export interface SentimentResult {
  sentimentScore: number
  emotionalThemes: string[]
  triggers: string[]
  distressLevel: 0 | 1 | 2 | 3
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}
