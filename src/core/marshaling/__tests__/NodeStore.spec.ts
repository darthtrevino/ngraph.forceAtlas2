import { NodeStore } from '../NodeStore'

const PPN = 10

describe('the node store', () => {
	it('throws if the memory buffer is not a multiple of ppn', () => {
		expect(() => new NodeStore(new Float32Array(PPN - 1))).toThrow()
		expect(() => new NodeStore(new Float32Array(PPN))).not.toThrow()
	})
})
