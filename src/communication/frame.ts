import Writer from './writer';
import Reader from './reader';
import Box from './box';

export declare class Raw {
  size: number;
  box?: Box;
  raw?: Buffer;
}

export class Frame {
  private readonly data: Buffer;
  private readonly length: number;
  private alreadyRead: boolean;
  private isWritten: boolean;

  constructor(data: Buffer) {
    this.data = data;
    this.length = data.byteLength;
    this.isWritten = false;
    this.alreadyRead = false;
  }

  buffer(): Buffer {
    return this.write();
  }

  size(): number {
    return this.data.length;
  }

  write() {
    const writer = new Writer();
    writer.skip(4);
    writer.wunit(2, 1);
    writer.wbytes(this.data);
    const buffer = writer.toBuffer();
    buffer.writeUInt32BE(buffer.length, 0);
    return buffer;
  }

  read(): Raw {
    const reader = new Reader(this.data);
    const raw = {
      size: reader.ruint(4),
    } as Raw;

    const offset = reader.ruint(1);
    if (offset) {
      throw new Error(`Invalid data offset, found ${offset}`);
    }

    if (reader.remaining() < raw.size) {
      const payload = reader.drain();
      raw.box = new Box(payload);
      raw.raw = payload;
      return raw;
    }
    return raw;
  }
}
