export type ExceptionKind = 'technical';
export type ExceptionCode = 'STATE_STORE_LISTENER_ERROR';

export class Exception extends Error {
  public readonly kind;
  public readonly code;
  public override readonly cause;
  public readonly metadata;

  public constructor(
    message: string,
    kind: ExceptionKind,
    code: ExceptionCode,
    cause?: Error,
    metadata?: Readonly<Record<string, unknown>>,
  ) {
    super(message);

    this.kind = kind;
    this.code = code;
    this.cause = cause;
    this.metadata = metadata;
  }
}
