export class PrivateDataUnavailableError extends Error {
  constructor(domain: string) {
    super(`Your private ${domain} data is temporarily unavailable. Please try again.`);
    this.name = "PrivateDataUnavailableError";
  }
}
