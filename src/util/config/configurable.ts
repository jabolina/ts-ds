import {Config} from './index';

export interface Configurable<T extends Config> {
  configuration: () => T;
}
