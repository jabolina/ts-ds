import {Config} from '../util/config';

export interface ReconnectConfiguration extends Config {
  reconnect?: boolean;
  maxDelay?: number;
  delay?: number;
  limit?: (attempts: number) => number;
}

export interface Configuration extends Config {
  id?: string;
  containerId?: string;
  host?: string;
  port?: number;
  transport?: 'tcp';
  reconnect?: ReconnectConfiguration;
}
