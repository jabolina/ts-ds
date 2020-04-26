export class Versioned<V> {
  readonly value: V;
  readonly version: number;
  readonly createdAt: number;

  constructor(value: V, version: number, createdAt?: number) {
    this.value = value;
    this.version = version;
    this.createdAt = createdAt || Date.now();
  }

  map<U>(transformer: (v: V) => U): Versioned<U> {
    return new Versioned<U>(transformer(this.value), this.version + 1);
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Versioned)) {
      return false;
    }

    const casted = other as Versioned<V>;
    return (
      this.value === casted.value &&
      this.version === casted.version &&
      this.createdAt === casted.createdAt
    );
  }

  static valueOrElse<U>(
    versioned: Versioned<U> | undefined,
    defaultValue: U
  ): U {
    return versioned?.value || defaultValue;
  }

  static valueOrUndefined<U>(
    versioned: Versioned<U> | undefined
  ): U | undefined {
    return versioned?.value;
  }
}
