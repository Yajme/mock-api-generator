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