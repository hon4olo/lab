import type { CustomerDefinition } from './CustomerDefinition';
import type { CustomerInstance } from './CustomerInstance';

export function createCustomerInstance(
  instanceId: string,
  definition: CustomerDefinition,
): CustomerInstance {
  return {
    id: instanceId,
    type: definition.type,
    variantId: definition.variantId,
    patienceMs: definition.basePatienceMs,
  };
}
