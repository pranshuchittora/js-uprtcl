import { inject, injectable } from 'inversify';
import { Pattern, PatternTypes, HashedPattern, CreatePattern, Hashed } from '@uprtcl/cortex';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

export type NewContextArgs = { timestamp: number; nonce: number } | { context: string };

@injectable()
export class ContextPattern implements Pattern {
  constructor(
    @inject(PatternTypes.Core.Hashed)
    protected hashedPattern: Pattern & HashedPattern<any>
  ) {}

  recognize(object: object) {
    return (
      this.hashedPattern.recognize(object) &&
      typeof this.hashedPattern.extract(object as Hashed<string>) === 'string'
    );
  }
}
