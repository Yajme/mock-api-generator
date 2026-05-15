// src/types/index.ts  — create this file for shared types
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  permissions: "read" | "read_write";
  is_active: boolean;
  created_at: Date;
  last_used_at: Date | null;
}


export interface ISchemaField {
  name: string;
  fakerType: string;
  options?: unknown;
}

export interface ISchema {
  id?: string;
  name: string;
  is_preset: boolean;
  fields: ISchemaField[];
  owner_id: string | null;
}


export interface Endpoint {
  id: string;
  owner_id: string;
  schema_id: string;
  name: string;
  version: string;
  visible_fields: string[];
  cached_data: Record<string, unknown>[];
  ttl_seconds: number;
  ttl_expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
