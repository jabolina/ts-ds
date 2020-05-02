import Connection from './connection';
import {Frame, Raw} from './frame';
import {Socket} from 'net';

export default class Transport {
  private readonly id: string;
  private readonly pId: string;
  private readonly handler: Connection;
  private readonly writeComplete: boolean;
  private readonly readComplete: boolean;
  private readonly pending: Frame[];

  constructor(identifier: string, pId: string, handler: Connection) {
    this.id = identifier;
    this.pId = pId;
    this.handler = handler;
    this.writeComplete = false;
    this.readComplete = false;
    this.pending = [];
  }

  hasWritesPending(): boolean {
    return this.pending.length > 0;
  }

  encode(frame: Frame): void {
    this.pending.push(frame);
  }

  write(socket: Socket): void {
    this.pending.splice(0).forEach(frame => {
      const buffer = frame.buffer();
      socket.write(buffer);
      socket.pipe(socket);
    });
  }

  read(buffer: Buffer): Raw {
    const frame = new Frame(buffer);
    return frame.read();
  }
}
