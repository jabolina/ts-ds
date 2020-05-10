const SINGLETON = Symbol('ts-ds-singleton-instance');

type Singleton<T extends new (...args: unknown[]) => {}> = T & {
  [SINGLETON]: T extends new (...args: unknown[]) => infer I ? I : never;
};

export const singleton = <T extends new (...args: unknown[]) => {}>(clazz: T) =>
  new Proxy(clazz, {
    construct(target: Singleton<T>, argumentList, newTarget) {
      if (target.prototype !== newTarget.prototype) {
        return Reflect.construct(target, argumentList, newTarget);
      }

      if (!target[SINGLETON]) {
        target[SINGLETON] = Reflect.construct(target, argumentList, newTarget);
      }

      return target[SINGLETON];
    },
  });
