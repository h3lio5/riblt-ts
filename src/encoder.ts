import type { InputSymbol, HashedSymbol } from "./symbol";
import { CodedSymbol } from "./symbol";
import { CodingWindow } from "./codingwindow";

export class Encoder<T extends InputSymbol<T>> {
	private window: CodingWindow<T>;

	constructor() {
		this.window = new CodingWindow<T>();
	}

	addSymbol(s: T): void {
		this.window.addSymbol(s);
	}

	addHashedSymbol(s: HashedSymbol<T>): void {
		this.window.addHashedSymbol(s);
	}

	produceNextCodedSymbol(): CodedSymbol<T> {
		return this.window.applyWindow(
			new CodedSymbol<T>({ symbol: {} as T, hash: 0n }, 0n),
			1n,
		);
	}

	reset(): void {
		this.window.reset();
	}
}
