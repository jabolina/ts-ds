import {EventEmitter} from 'events';
import {Configuration} from './configuration';
import {v4} from 'uuid';
import Connection from './connection';

export default class Communication extends EventEmitter {
  private readonly options: Configuration;
  readonly id: string;

  constructor(options?: Configuration) {
    super();
    this.options = options || {};

    if (!this.options.id) {
      this.options.id = v4();
    }
    this.id = this.options.id;
  }

  dispatch(name: string, ...args: any): boolean {
    return true;
  }

  connect(): Promise<Connection> {
    return new Connection(this.options, this).connect();
  }
}
