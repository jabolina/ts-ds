export interface Configurable<T extends Configurable<T>> {
  configuration: () => T;
}
