import Writer from './writer';
import Reader from './reader';
import Box from './box';

export declare class Raw {
  size: number;
  boxes?: Box[];
  raws?: Buffer[];
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
    writer.wunit(this.data.length + 1, 4);
    writer.wunit(2, 1);
    writer.wbytes(this.data);
    return writer.toBuffer();
  }

  read(): Raw {
    const reader = new Reader(this.data);
    const boxes = [];
    const raws = [];

    while (reader.remaining() > 0) {
      const length = reader.ruint(4);
      const raw = reader.rbytes(length);
      const offset = raw.readUInt8(0);
      if (offset < 2) {
        throw new Error(`Invalid data offset, found ${offset}`);
      }
      const data = raw.slice(1);
      raws.push(raw);
      boxes.push(new Box(data));
    }
    return {
      size: reader.size(),
      boxes,
      raws,
    };
  }
}
