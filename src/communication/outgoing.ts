import Connection from './connection';
import Sender from './sender';
import {Frame} from './frame';

export default class Outgoing {
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  available(): boolean {
    return true;
  }

  send(sender: Sender, tag: Buffer, payload: Frame): void {

  }
}
