export class AppError extends Error {
  code: number;

  constructor(message: string, code = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
