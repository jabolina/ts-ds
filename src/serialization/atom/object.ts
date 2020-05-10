import {AnyAtom, FixedAtom, NumberAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';

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

type Constructable<T> = {
  new (): T;
};

// eslint-disable-next-line prettier/prettier
export class ObjectAtom<T extends {[key in ComposedKey]: unknown}> extends VariableAtom<T> {
  readonly fields: Inner<unknown>[];
  readonly tConstructor: Constructable<T>;
  readonly named: Record<string, Inner<unknown>>;

  constructor(
    rw: NumberAtom,
    description: Inner<unknown>[],
    tConstructor?: Constructable<T>
  ) {
    super(rw);
    this.fields = [...description];
    this.tConstructor = tConstructor || Object();
    this.named = {};
    for (let i = 0; i < this.fields.length; i += 1) {
      if (this.fields[i].name) {
        this.named[this.fields[i].name] = this.fields[i];
      }
    }
  }

  poolWrite(dest: Write, value: T, into: Buffer, offset: number): Write {
    for (const field of this.fields) {
      // eslint-disable-next-line no-prototype-builtins
      if (field.name && !value.hasOwnProperty(field.name)) {
        // serializing unknown object
      }

      const content = value[field.name];
      if (field.call) {
        if (field.call.poolWrite) {
          field.call.poolWrite(dest, value, into, offset);
        } else if (field.call.write) {
          field.call.write(value, into, offset);
        }
      } else {
        if (field.rw instanceof FixedAtom) {
          into = this.ensure(offset + field.rw.width + 1, into);
        }
        field.rw.poolWrite(dest, content, into, offset);
      }

      if (dest.err) {
        return dest;
      }
      offset = dest.offset;
    }
    return dest.reset(undefined, offset, into);
  }

  poolRead(dest: Read, from: Buffer, offset: number, value?: T): Read {
    if (dest.value && typeof dest.value === 'object') {
      if (dest.value.constructor !== this.tConstructor) {
        dest.value = new this.tConstructor();
      }
    } else {
      dest.value = new this.tConstructor();
    }

    const placeholder = new Read();
    for (const field of this.fields) {
      if (field.call) {
        if (field.call.poolRead) {
          field.call.poolRead(placeholder, from, offset, dest.value);
        } else if (field.call.read) {
          const res = field.call.read(from, offset, dest.value);
          placeholder.copy(res);
        }
      } else {
        field.rw.poolRead(placeholder, from, offset);
      }

      if (placeholder.err) {
        return dest.copy(placeholder);
      }
      offset = placeholder.offset;
      if (field.name) {
        dest.value[field.name] = placeholder.value;
      }
    }
    return dest.reset(undefined, offset, placeholder.value);
  }

  isType(value: unknown) {
    return value !== null && typeof value === 'object';
  }
}