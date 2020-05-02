import Connection from './connection';
import Sender from './sender';
import {Frame} from './frame';
import {CircularBuffer} from './buffer';

export default class Outgoing {
  private readonly connection: Connection;
  private readonly buffer: CircularBuffer;
  private nextDelivery: number;
  private nextPending: number;

  constructor(connection: Connection) {
    this.connection = connection;
    this.buffer = new CircularBuffer(4096);
    this.nextDelivery = 0;
    this.nextPending = 0;
  }

  available(): boolean {
    return this.buffer.available() > 0;
  }

  send(sender: Sender, tag: Buffer, payload: Frame): void {
    this.buffer.push({
      id: this.nextDelivery++,
      data: payload,
      tag,
      sender,
    });
  }

  process() {
    while (this.nextPending < this.nextDelivery) {
      const envelope = this.buffer.poll(this.nextPending);
      if (envelope) {
        // todo: backpressure
        envelope.sender.session.output(envelope.data);
        this.nextPending++;
      }
    }
  }
}
