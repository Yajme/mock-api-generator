export interface IEndpoint {
  id?: string;
  ownerId: string;
  schemaId: string;
  name: string;
  version: string;
  cachedData?: any;
  ttlSeconds: number;
  ttlExpiresAt?: string; // ISO date string
}
export interface ICreateEndpointParams extends IEndpoint {
    count: number;
}

export interface IUpdateEndpoint {
  id: string;
  ownerId: string;
  name?: string;
  schemaId?: string;
  version?: string;
  ttlSeconds?: number;
  count?: number;
}

export interface IDeleteEndpoint {
  id: string;
  ownerId: string;
}

export interface IListEndpointQuery {
  filter?: string;
  filterBy?: string;
}