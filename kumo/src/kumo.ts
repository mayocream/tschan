export const KumoUserAgent = 'Kumo/0.0 (mayocream/tschan)'

export interface UserMetadata {
  ulid: string
  name: string
  username: string
  avatar: string
  email: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}
