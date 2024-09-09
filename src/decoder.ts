import type { InputSymbol, HashedSymbol, CodedSymbol } from "./symbol";
import { CodingWindow } from "./codingwindow";
import { RandomMapping } from "./mapping";

export class Decoder<T extends InputSymbol<T>> {
	private cs: CodedSymbol<T>[] = [];
	private local: CodingWindow<T> = new CodingWindow<T>();
	private window: CodingWindow<T> = new CodingWindow<T>();
	private remote: CodingWindow<T> = new CodingWindow<T>();
	private decodable: number[] = [];
	private decoded = 0;

	isDecoded(): boolean {
		return this.decoded === this.cs.length;
	}

	getLocal(): HashedSymbol<T>[] {
		return this.local.symbols;
	}

	getRemote(): HashedSymbol<T>[] {
		return this.remote.symbols;
	}

	addSymbol(s: T): void {
		const th: HashedSymbol<T> = { symbol: s, hash: s.hash() };
		this.addHashedSymbol(th);
	}

	addHashedSymbol(s: HashedSymbol<T>): void {
		this.window.addHashedSymbol(s);
	}

	addCodedSymbol(codedSymbol: CodedSymbol<T>): void {
        let c = codedSymbol;
		c = this.window.applyWindow(c, -1n);
		c = this.remote.applyWindow(c, -1n);
		c = this.local.applyWindow(c, 1n);

		this.cs.push(c);

		if (
			(c.count === 1n || c.count === -1n) &&
			c.hashedSymbol.hash === c.hashedSymbol.symbol.hash()
		) {
			this.decodable.push(this.cs.length - 1);
		} else if (c.count === 0n && c.hashedSymbol.hash === 0n) {
			this.decodable.push(this.cs.length - 1);
		}
	}

	private applyNewSymbol(t: HashedSymbol<T>, direction: bigint): RandomMapping {
		const m = new RandomMapping(t.hash);
		while (Number(m.nextIndex()) < this.cs.length) {
			const cidx = Number(m.nextIndex());
			this.cs[cidx] = this.cs[cidx].apply(t, direction);

			if (
				(this.cs[cidx].count === -1n || this.cs[cidx].count === 1n) &&
				this.cs[cidx].hashedSymbol.hash ===
					this.cs[cidx].hashedSymbol.symbol.hash()
			) {
				this.decodable.push(cidx);
			}
		}
		return m;
	}

	tryDecode(): void {
		for (let didx = 0; didx < this.decodable.length; didx++) {
			const cidx = this.decodable[didx];
			const c = this.cs[cidx];

			switch (c.count) {
				case 1n: {
					const ns: HashedSymbol<T> = {
						symbol: ({} as T).xor(c.hashedSymbol.symbol),
						hash: c.hashedSymbol.hash,
					};
					const m = this.applyNewSymbol(ns, -1n);
					this.remote.addHashedSymbolWithMapping(ns, m);
					this.decoded++;
					break;
				}
				case -1n: {
					const ns: HashedSymbol<T> = {
						symbol: ({} as T).xor(c.hashedSymbol.symbol),
						hash: c.hashedSymbol.hash,
					};
					const m = this.applyNewSymbol(ns, 1n);
					this.local.addHashedSymbolWithMapping(ns, m);
					this.decoded++;
					break;
				}
				case 0n:
					this.decoded++;
					break;
				default:
                    console.log("Invalid degree for decodable coded symbol");
			}
		}
		this.decodable = [];
	}

	reset(): void {
		this.cs = [];
		this.decodable = [];
		this.local.reset();
		this.remote.reset();
		this.window.reset();
		this.decoded = 0;
	}
}
