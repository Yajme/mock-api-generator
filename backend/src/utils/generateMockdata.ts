import { faker } from '@faker-js/faker';

interface Field {
  name: string;
  fakerType: string;
  options?: any;
}

const resolvefakerType = (fakerType: string, options?: any): any => {
  const [namespace, method] = fakerType.split('.') as [keyof typeof faker, string];

  const fakerNamespace = faker[namespace] as any;
  if (!fakerNamespace) throw new Error(`Unknown faker namespace: ${namespace}`)
  if (!fakerNamespace[method]) throw new Error(`Unknown faker method: ${namespace}.${method}`)

  return options
    ? fakerNamespace[method](options)
    : fakerNamespace[method]()
}

export const generateMockData = (fields: Field[], count: number = 10): any[] => {
  return Array.from({ length: count }, () => {
    return fields.reduce((row: any, field) => {
      row[field.name] = resolvefakerType(field.fakerType, field.options)
      return row
    }, {})
  })
}
