// src/mapping/RandomMapping.ts
export class RandomMapping {
	private prng: bigint;
	private lastIdx: bigint;

	constructor(initialState: bigint) {
		this.prng = initialState;
		this.lastIdx = 0n;
	}

	nextIndex(): bigint {
		const r = this.prng * 0xda942042e4dd58b5n;
		this.prng = r;

		this.lastIdx +=
			((BigInt(2) * this.lastIdx + BigInt(3))/ BigInt(2)) *
			(BigInt(1n << 32n) / (this.bigIntSqrt(r + BigInt(1)) - BigInt(1)));

		return this.lastIdx;
	}

	// taken from https://stackoverflow.com/a/53684036
	private bigIntSqrt(value: bigint): bigint {
		if (value < 0n) {
			throw "square root of negative numbers is not supported";
		}

		if (value < 2n) {
			return value;
		}

		function newtonIteration(n: bigint, x0: bigint): bigint {
			const x1 = (n / x0 + x0) >> 1n;
			if (x0 === x1 || x0 === x1 - 1n) {
				return x0;
			}
			return newtonIteration(n, x1);
		}

		return newtonIteration(value, 1n);
	}
}
