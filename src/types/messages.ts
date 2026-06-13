export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type DistressLevel = 0 | 1 | 2 | 3
