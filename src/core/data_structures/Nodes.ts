export enum N {
	x = 0,
	y = 1,
	dx = 2,
	dy = 3,
	old_dx = 4,
	old_dy = 5,
	mass = 6,
	convergence = 7,
	size = 8,
	fixed = 9,
}

export const ppn = 10

export class Nodes {
	private _ary: Float32Array

	public constructor(ary: Float32Array) {
		this._ary = ary
	}

	public set array(ary: Float32Array) {
		this._ary = ary
	}

	public get array() {
		return this._ary
	}

	public get length() {
		return this._ary.length
	}

	public x(index: number): number {
		return this._ary[index + N.x]
	}

	public y(index: number) {
		return this._ary[index + N.y]
	}

	public dx(index: number) {
		return this._ary[index + N.dx]
	}

	public dy(index: number) {
		return this._ary[index + N.dy]
	}

	public old_dx(index: number) {
		return this._ary[index + N.old_dx]
	}

	public old_dy(index: number) {
		return this._ary[index + N.old_dy]
	}

	public mass(index: number) {
		return this._ary[index + N.mass]
	}

	public convergence(index: number) {
		return this._ary[index + N.convergence]
	}

	public size(index: number) {
		return this._ary[index + N.size]
	}

	public fixed(index: number): boolean {
		return Boolean(this._ary[index + N.fixed])
	}

	public setX(index: number, value: number) {
		this._ary[index + N.x] = value
	}

	public setY(index: number, value: number) {
		this._ary[index + N.y] = value
	}

	public setDx(index: number, value: number) {
		this._ary[index + N.dx] = value
	}

	public setDy(index: number, value: number) {
		this._ary[index + N.dy] = value
	}

	public addDx(index: number, value: number) {
		this._ary[index + N.dx] += value
	}

	public addDy(index: number, value: number) {
		this._ary[index + N.dy] += value
	}

	public subDx(index: number, value: number) {
		this._ary[index + N.dx] -= value
	}

	public subDy(index: number, value: number) {
		this._ary[index + N.dy] -= value
	}

	public setOldDx(index: number, value: number) {
		this._ary[index + N.old_dx] = value
	}

	public setOldDy(index: number, value: number) {
		this._ary[index + N.old_dy] = value
	}

	public setMass(index: number, value: number) {
		this._ary[index + N.mass] = value
	}

	public setConvergence(index: number, value: number) {
		this._ary[index + N.convergence] = value
	}

	public setSize(index: number, value: number) {
		this._ary[index + N.size] = value
	}

	public setFixed(index: number, value: boolean) {
		this._ary[index + N.fixed] = value ? 1 : 0
	}

	public resetDeltas() {
		// Resetting positions & computing max values
		for (let n = 0; n < this.length; n += ppn) {
			this.setOldDx(n, this.dx(n))
			this.setOldDy(n, this.dy(n))
			this.setDx(n, 0)
			this.setDy(n, 0)
		}
	}

	public getBounds(): [number, number, number, number] {
		let minX = Infinity
		let maxX = -Infinity
		let minY = Infinity
		let maxY = -Infinity

		// Setting up
		// Computing min and max values
		for (let n = 0; n < this.length; n += ppn) {
			minX = Math.min(minX, this.x(n))
			maxX = Math.max(maxX, this.x(n))
			minY = Math.min(minY, this.y(n))
			maxY = Math.max(maxY, this.y(n))
		}
		return [minX, maxX, minY, maxY]
	}
}
