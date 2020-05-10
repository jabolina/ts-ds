export interface Copyable<T> {
  copy(from: T): T;
}
