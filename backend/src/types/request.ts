// src/types/requests.ts
export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateEndpointBody {
  name: string;
  schema_id: string;
  version: string;
  ttl_seconds?: number;
  count?: number;
}
