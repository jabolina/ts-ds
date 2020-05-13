import {AnyAtom, FixedAtom, NumberAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';
import {AtomCode} from './index';
import {StringAtom} from './string';
import {UInt32BE} from './number';

type ComposedKey = string | number;

type Inner<T> = {
  name: string;
  rw: AnyAtom;
  call?: {
    poolWrite?: (dest: Write, value: T, into: Buffer, offset: number) => Write;
    write?: (value: T, into: Buffer, offset: number) => Write;
    read?: (from: Buffer, offset: number, value?: T) => Read;
    poolRead?: (dst: Read, from: Buffer, offset: number, value?: T) => Read;
  };
};

// eslint-disable-next-line prettier/prettier
export class ObjectAtom<T extends {[key in ComposedKey]: unknown}> extends VariableAtom<T> {
  readonly fields: Inner<unknown>[];
  private readonly nameParser = new StringAtom(new UInt32BE(), 'utf8');

  constructor(
    rw: NumberAtom,
    description: Inner<unknown>[],
    ...rws: AnyAtom[]
  ) {
    super(AtomCode.ObjectCode, rw, ...rws);
    this.fields = [...description];
  }

  poolWrite(dest: Write, value: T): Write {
    if (!dest.buffer) {
      return dest.reset(new Error('TODO: buffer not found error'));
    }

    dest.copy(super.poolWrite(dest, value));
    for (const field of this.fields) {
      // eslint-disable-next-line no-prototype-builtins
      if (field.name && !value.hasOwnProperty(field.name)) {
        return dest.fail(
          new Error(`TODO: Object has not property ${field.name}`)
        );
      }

      const content = value[field.name];
      dest.copy(this.nameParser.poolWrite(dest, field.name));
      if (dest.err) {
        return dest;
      }

      if (field.rw instanceof FixedAtom) {
        dest.buffer = this.ensure(dest.offset + field.rw.width, dest.buffer);
      }
      dest.copy(field.rw.poolWrite(dest, content));

      if (dest.err) {
        return dest;
      }
    }
    return dest;
  }

  poolRead(dest: Read, from: Buffer): Read {
    dest.value = {};
    const placeholder = new Read(undefined, dest.offset);

    while (placeholder.offset < from.length) {
      const code = from.readUInt8(placeholder.offset, true);
      if (code !== this.nameParser.code) {
        return dest.fail(
          new Error(`TODO: ${code} not name parser code`),
          placeholder.offset
        );
      }
      placeholder.offset += 1;
      placeholder.copy(this.nameParser.poolRead(placeholder, from));

      const name = placeholder.value;
      const valueCode = from.readUInt8(placeholder.offset, true);
      const rw = this.select(valueCode);
      placeholder.offset += 1;

      if (rw) {
        placeholder.copy(rw.poolRead(placeholder, from));
      } else if (valueCode === this.code) {
        placeholder.copy(this.poolRead(placeholder, from));
      } else {
        return dest.fail(
          new Error(`TODO: not found parser ${valueCode}`),
          placeholder.offset
        );
      }

      if (placeholder.err) {
        return dest.copy(placeholder);
      }

      dest.value[name] = placeholder.value;
    }

    return dest.reset(undefined, placeholder.offset, dest.value);
  }

  isType(value: unknown) {
    return value !== null && typeof value === 'object';
  }
}
