import type { Vote, Place } from '../db'

export interface VoteWithPlace extends Vote {
  places: Place
}

export interface VoteSummary {
  placeId: string
  likes: number
  dislikes: number
  myVote: 'like' | 'dislike' | null
}
