export interface Comparable<T extends Comparable<T>> {
  compareTo: (t: T) => number;
}
