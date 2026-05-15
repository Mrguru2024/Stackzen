export class OperationalActionApplicationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'OperationalActionApplicationError';
  }
}
