export class CustomError extends Error {
  public discordMessage: string;
  public author: string;
  public channel: string;
  public constructor() {
    super();
  }
}
