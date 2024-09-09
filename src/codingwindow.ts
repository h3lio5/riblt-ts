import type { InputSymbol, HashedSymbol, CodedSymbol } from "./symbol";
import { RandomMapping } from "./mapping";

interface SymbolMapping {
	sourceIdx: number;
	codedIdx: bigint;
}

class MappingHeap {
	private heap: SymbolMapping[] = [];

	push(item: SymbolMapping): void {
		this.heap.push(item);
		this.fixTail();
	}

	pop(): SymbolMapping | undefined {
		if (this.heap.length === 0) return undefined;
		const item = this.heap[0];
		const last = this.heap.pop();
		if (this.heap.length > 0 && last != null) {
			this.heap[0] = last;
			this.fixHead();
		}
		return item;
	}

	peek(): SymbolMapping | undefined {
		return this.heap[0];
	}

	private fixHead(): void {
		let current = 0;
		while (true) {
			const leftChild = current * 2 + 1;
			if (leftChild >= this.heap.length) break;
			let smallestChild = leftChild;
			const rightChild = leftChild + 1;
			if (
				rightChild < this.heap.length &&
				this.heap[rightChild].codedIdx < this.heap[leftChild].codedIdx
			) {
				smallestChild = rightChild;
			}
			if (this.heap[current].codedIdx <= this.heap[smallestChild].codedIdx)
				break;
			[this.heap[current], this.heap[smallestChild]] = [
				this.heap[smallestChild],
				this.heap[current],
			];
			current = smallestChild;
		}
	}

	private fixTail(): void {
		let current = this.heap.length - 1;
		while (current > 0) {
			const parent = Math.floor((current - 1) / 2);
			if (this.heap[parent].codedIdx <= this.heap[current].codedIdx) break;
			[this.heap[parent], this.heap[current]] = [
				this.heap[current],
				this.heap[parent],
			];
			current = parent;
		}
	}

	get length(): number {
		return this.heap.length;
	}
}

export class CodingWindow<T extends InputSymbol<T>> {
	symbols: HashedSymbol<T>[] = [];
	private mappings: RandomMapping[] = [];
	private queue: MappingHeap = new MappingHeap();
	private nextIdx = 0n;

	addSymbol(t: T): void {
		const th: HashedSymbol<T> = { symbol: t, hash: t.hash() };
		this.addHashedSymbol(th);
	}

	addHashedSymbol(t: HashedSymbol<T>): void {
		this.addHashedSymbolWithMapping(t, new RandomMapping(t.hash));
	}

	addHashedSymbolWithMapping(t: HashedSymbol<T>, m: RandomMapping): void {
		this.symbols.push(t);
		this.mappings.push(m);
		this.queue.push({
			sourceIdx: this.symbols.length - 1,
			codedIdx: m.nextIndex(),
		});
	}

	applyWindow(initialCw: CodedSymbol<T>, direction: bigint): CodedSymbol<T> {
		if (this.queue.length === 0) {
			this.nextIdx += 1n;
			return initialCw;
		}

		let resultCw = initialCw;

		while (true) {
			const peekedItem = this.queue.peek();
			if (!peekedItem || peekedItem.codedIdx !== this.nextIdx) {
				break;
			}

			const top = this.queue.pop();
			// This should never happen, but we check for type safety and to stop biome linter from screaming at me.
			if (!top) {
				break;
			}

			resultCw = resultCw.apply(this.symbols[top.sourceIdx], direction);
			const nextMap = this.mappings[top.sourceIdx].nextIndex();
			this.queue.push({ sourceIdx: top.sourceIdx, codedIdx: nextMap });
		}

		this.nextIdx += 1n;
		return resultCw;
	}

	reset(): void {
		this.symbols = [];
		this.mappings = [];
		this.queue = new MappingHeap();
		this.nextIdx = 0n;
	}
}
