// Type declarations for custom Jest matchers
declare namespace jest {
  interface Matchers<R> {
    toBeOneOf(expected: unknown[]): R;
  }
}
