import { faker } from '@faker-js/faker';
const resolvefakerType = (fakerType, options) => {
  const [namespace, method] = fakerType.split('.')

  if (!faker[namespace]) throw new Error(`Unknown faker namespace: ${namespace}`)
  if (!faker[namespace][method]) throw new Error(`Unknown faker method: ${namespace}.${method}`)

  return options
    ? faker[namespace][method](options)
    : faker[namespace][method]()
}

export const generateMockData = (fields, count = 10) => {
  return Array.from({ length: count }, () => {
    return fields.reduce((row, field) => {
      row[field.name] = resolvefakerType(field.fakerType, field.options)
      return row
    }, {})
  })
}
