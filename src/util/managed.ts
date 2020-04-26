export interface Managed<T> {
  start: () => Promise<T>;
  isRunning: () => boolean;
  stop: () => Promise<void>;
}
