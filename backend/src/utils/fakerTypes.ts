import { faker } from "@faker-js/faker";

type FakerNamespaceModule = Record<string, unknown>;

const getFakerNamespaceMethods = (
  namespaceModule: FakerNamespaceModule,
): string[] => {
  return Object.keys(namespaceModule).filter((methodName) => {
    if (methodName.startsWith("_")) {
      return false;
    }

    return typeof namespaceModule[methodName] === "function";
  });
};

export const FAKER_TYPES = Object.freeze(
  Object.keys(faker)
    .filter((namespace) => !namespace.startsWith("_"))
    .flatMap((namespace) => {
      const namespaceModule = faker[
        namespace as keyof typeof faker
      ] as unknown as FakerNamespaceModule;

      if (!namespaceModule || typeof namespaceModule !== "object") {
        return [];
      }

      return getFakerNamespaceMethods(namespaceModule)
        .sort()
        .map((methodName) => `${namespace}.${methodName}`);
    }),
);

export const FAKER_TYPES_SET = new Set(FAKER_TYPES);

export const isExistingFakerType = (fakerType: string): boolean => {
  return FAKER_TYPES_SET.has(fakerType);
};
