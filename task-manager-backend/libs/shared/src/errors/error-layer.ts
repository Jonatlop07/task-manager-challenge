export const ERROR_LAYERS = {
  DOMAIN: 'domain',
  APPLICATION: 'application',
  INFRASTRUCTURE: 'infrastructure',
  INTERFACE: 'interface',
  SHARED_KERNEL: 'shared-kernel',
} as const;

export type ErrorLayer = (typeof ERROR_LAYERS)[keyof typeof ERROR_LAYERS];
