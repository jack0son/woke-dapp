export class WrapperError extends Error {
  constructor(message) {
		super('twitter:' + message);
    this.name = this.constructor.name; // error name == class name
   // Clip the constructor invocation from the stack trace.
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends WrapperError {
  constructor(error) {
    super(error.message);
    this.data = {error};
  }
}

export class TokenError extends WrapperError {
  constructor(error, token) {
    super(error.message);
    this.data = { token };
  }
}

export class ResponseError extends WrapperError {
  constructor(error) {
    super(error.message);
    this.data = { error };
  }
}
