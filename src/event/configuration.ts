import {Config} from '../util/config';

export interface Server extends Config {
  host: string;
  port: number;
  resetDisconnect: boolean;
  connectHeaders: {[key: string]: string};
}

export interface Reconnect extends Config {
  maxReconnects: number;
}

export interface EventEmitterConfiguration extends Config {
  server?: Server;
  reconnect?: Reconnect;
  destination?: string;
  ignore: string[];
}
