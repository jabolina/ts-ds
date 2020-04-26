import {Comparable} from '../comparable';

export interface Timestamp<T extends Timestamp<T>> extends Comparable<T> {
  isNewerThan(other: T): boolean;
  isOlderThan(other: T): boolean;
}
