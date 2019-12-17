import { QuadTree } from '../QuadTree'

describe('The QuadTree Data Structure', () => {
	it('can be constructed empty', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		expect(qt).toBeDefined()
		expect(qt.width).toEqual(10)
		expect(qt.height).toEqual(10)
		expect(qt.node).toBeUndefined()
		expect(qt.centerX).toEqual(5)
		expect(qt.centerY).toEqual(5)
		expect(qt.centerOfMassX).toEqual(5)
		expect(qt.centerOfMassY).toEqual(5)
		expect(qt.mass).toEqual(0)
		expect(qt.isLeaf).toEqual(true)
	})

	it('can add a single node', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		qt.insert(0, 3, 7, 7)

		// node swings mass & center
		expect(qt.mass).toEqual(3)
		expect(qt.centerOfMassX).toEqual(7)
		expect(qt.centerOfMassY).toEqual(7)
		expect(qt.isLeaf).toEqual(true)
	})

	it.only('can add two nodes', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		qt.insert(0, 3, 7, 7)
		qt.insert(1, 2, 2, 2)

		// node swings mass & center
		expect(qt.mass).toEqual(5)
		expect(qt.centerOfMassX).toEqual(5)
		expect(qt.centerOfMassY).toEqual(5)
		expect(qt.isLeaf).toEqual(false)
	})
})
