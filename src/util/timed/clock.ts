import {Timestamp} from './timestamp';

export interface Clock<T extends Timestamp<T>> {
  time: () => T;
}
