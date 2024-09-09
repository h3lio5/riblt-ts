export interface InputSymbol<T> {
	xor(t2: T): T;
	hash(): bigint;
}

export interface HashedSymbol<T extends InputSymbol<T>> {
	symbol: T;
	hash: bigint;
}

export class CodedSymbol<T extends InputSymbol<T>> {
	constructor(
		public hashedSymbol: HashedSymbol<T>,
		public count: bigint,
	) {}

	apply(s: HashedSymbol<T>, direction: bigint): CodedSymbol<T> {
		return new CodedSymbol<T>(
			{
				symbol: this.hashedSymbol.symbol.xor(s.symbol),
				hash: this.hashedSymbol.hash ^ s.hash,
			},
			this.count + direction,
		);
	}
}
