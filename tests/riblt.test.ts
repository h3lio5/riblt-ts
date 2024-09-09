// src/tests/RIBLT.test.ts

import { type InputSymbol, Encoder, Decoder } from '../src/index';

// Define a simple Item class that implements RIBLTSymbol
class Item implements InputSymbol<Item> {
  constructor(private value: bigint) {}

  xor(other: Item): Item {
    return new Item(this.value ^ other.value);
  }

  hash(): bigint {
    // Simple hash function for demonstration purposes
    return this.value * 0xdeadbeefn;
  }
}

describe('RIBLT Set Reconciliation', () => {
  it('should correctly reconcile differences between two sets', () => {
    // Alice's set
    const aliceSet = [1n, 2n, 3n, 4n, 5n].map(n => new Item(n));
    
    // Bob's set (missing 2, has 6 instead)
    const bobSet = [1n, 3n, 4n, 5n, 6n].map(n => new Item(n));

    // Create encoder for Alice
    const encoder = new Encoder<Item>();
    for (const item of aliceSet) {
        encoder.addSymbol(item);
    }

    // Create decoder for Bob
    const decoder = new Decoder<Item>();
    for (const item of bobSet) {
        decoder.addSymbol(item);
    }

    // Simulate transmission of coded symbols
    let codedSymbolsSent = 0;
    while (!decoder.isDecoded()) {
      const codedSymbol = encoder.produceNextCodedSymbol();
      decoder.addCodedSymbol(codedSymbol);
      decoder.tryDecode();
      codedSymbolsSent++;

      // Prevent infinite loop in case of failure
      if (codedSymbolsSent > 100) {
        throw new Error('Failed to reconcile within a reasonable number of iterations');
      }
    }

    // Check results
    const aliceOnly = decoder.getRemote();
    const bobOnly = decoder.getLocal();

    expect(aliceOnly.length).toBe(1);
    expect(aliceOnly[0].symbol).toBe(new Item(2n));

    expect(bobOnly.length).toBe(1);
    expect(bobOnly[0].symbol).toBe(new Item(6n));

    console.log(`Set reconciliation completed in ${codedSymbolsSent} coded symbols`);
  });

  // it('should handle empty difference between sets', () => {
  //   const sharedSet = [1n, 2n, 3n, 4n, 5n].map(n => new Item(n));

  //   const encoder = new Encoder<Item>();
  //   const decoder = new Decoder<Item>();

  //   for (const item of sharedSet) {
  //       encoder.addSymbol(item);
  //       decoder.addSymbol(item);
  //   }

  //   let codedSymbolsSent = 0;
  //   while (!decoder.isDecoded()) {
  //     const codedSymbol = encoder.produceNextCodedSymbol();
  //     decoder.addCodedSymbol(codedSymbol);
  //     decoder.tryDecode();
  //     codedSymbolsSent++;

  //     if (codedSymbolsSent > 100) {
  //       throw new Error('Failed to reconcile within a reasonable number of iterations');
  //     }
  //   }

  //   expect(decoder.getRemote().length).toBe(0);
  //   expect(decoder.getLocal().length).toBe(0);

  //   console.log(`Empty difference reconciliation completed in ${codedSymbolsSent} coded symbols`);
  // });

  // it('should handle completely different sets', () => {
  //   const aliceSet = [1n, 2n, 3n, 4n, 5n].map(n => new Item(n));
  //   const bobSet = [6n, 7n, 8n, 9n, 10n].map(n => new Item(n));

  //   const encoder = new Encoder<Item>();
  //   const decoder = new Decoder<Item>();

  //   for (const item of aliceSet) {
  //       encoder.addSymbol(item);
  //   }

  //   for (const item of bobSet) {
  //       decoder.addSymbol(item)
  //   }

  //   let codedSymbolsSent = 0;
  //   while (!decoder.isDecoded()) {
  //     const codedSymbol = encoder.produceNextCodedSymbol();
  //     decoder.addCodedSymbol(codedSymbol);
  //     decoder.tryDecode();
  //     codedSymbolsSent++;

  //     if (codedSymbolsSent > 200) {
  //       throw new Error('Failed to reconcile within a reasonable number of iterations');
  //     }
  //   }

  //   expect(decoder.getRemote().length).toBe(5);
  //   expect(decoder.getLocal().length).toBe(5);

  //   const remoteValues = new Set(decoder.getRemote().map(item => item.symbol.toString()));
  //   const localValues = new Set(decoder.getLocal().map(item => item.symbol.toString()));

  //   for (const item of aliceSet) {
  //       expect(remoteValues.has(item.toString())).toBe(true);
  //   }
  //   for (const item of bobSet) {
  //       expect(localValues.has(item.toString())).toBe(true);
  //   }

  //   console.log(`Completely different sets reconciliation completed in ${codedSymbolsSent} coded symbols`);
  // });
});