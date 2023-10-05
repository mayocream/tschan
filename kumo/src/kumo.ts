import type { IRequest, Route } from 'itty-router'

export const KumoUserAgent = 'Kumo/0.0 (mayocream/tschan)'

export type KumoRequest = {
  user?: UserMetadata
  role?: Roles
} & IRequest

export type UserMetadata = {
  ulid: string
  name: string
  username: string
  avatar: string
  email: string
  created_at: string
  updated_at?: string
  deleted_at?: string
  [key: string]: any
}

export enum Roles {
  // うむ！Copilot いいネーミングセンスしてるね！
  noob = '庶民',
  magician = '魔法使い',
  noble = '貴族',
  admin = '王様',
}

export type RoleType = keyof typeof Roles
