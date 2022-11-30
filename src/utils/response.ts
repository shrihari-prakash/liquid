export class SuccessResponse {
  ok = 1;
  data?: any;

  constructor(data?: any) {
    this.data = data;
  }
}

export class ErrorResponse {
  ok = 0;
  error: string;
  additionalInfo?: any;

  constructor(error: string, data?: any) {
    this.error = error;
    this.additionalInfo = data;
  }
}
