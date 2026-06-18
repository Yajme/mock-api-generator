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

export interface ICreateSchema extends ISchema {}
export type IUpdateSchema = Pick<ISchema, 'id'> & Partial<Omit<ISchema, 'id'>>;