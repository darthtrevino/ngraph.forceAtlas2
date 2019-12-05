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
	private _ary: Uint32Array

	public constructor(ary: Uint32Array) {
		this._ary = ary
	}

	public set array(ary: Uint32Array) {
		this._ary = ary
	}

	public get array() {
		return this._ary
	}

	public get length() {
		return this._ary.length
	}

	public x(index: number): number {
		return this._ary[index + N.x] / 100
	}

	public y(index: number) {
		return this._ary[index + N.y] / 100
	}

	public dx(index: number) {
		return this._ary[index + N.dx] / 100
	}

	public dy(index: number) {
		return this._ary[index + N.dy] / 100
	}

	public old_dx(index: number) {
		return this._ary[index + N.old_dx] / 100
	}

	public old_dy(index: number) {
		return this._ary[index + N.old_dy] / 100
	}

	public mass(index: number) {
		return this._ary[index + N.mass] / 100
	}

	public convergence(index: number) {
		return this._ary[index + N.convergence] / 100
	}

	public size(index: number) {
		return this._ary[index + N.size] / 100
	}

	public fixed(index: number): boolean {
		return Boolean(this._ary[index + N.fixed])
	}

	public setX(index: number, value: number) {
		Atomics.store(this._ary, index + N.x, value * 100)
	}

	public setY(index: number, value: number) {
		Atomics.store(this._ary, index + N.y, value * 100)
	}

	public setDx(index: number, value: number) {
		Atomics.store(this._ary, index + N.dx, value * 100)
	}

	public setDy(index: number, value: number) {
		Atomics.store(this._ary, index + N.dy, value * 100)
	}

	public addDx(index: number, value: number) {
		Atomics.add(this._ary, index + N.dx, value * 100)
	}

	public addDy(index: number, value: number) {
		Atomics.add(this._ary, index + N.dy, value * 100)
	}

	public subtractDx(index: number, value: number) {
		Atomics.sub(this._ary, index + N.dx, value * 100)
	}

	public subtractDy(index: number, value: number) {
		Atomics.sub(this._ary, index + N.dy, value * 100)
	}

	public setOldDx(index: number, value: number) {
		Atomics.store(this._ary, index + N.old_dx, value * 100)
	}

	public setOldDy(index: number, value: number) {
		Atomics.store(this._ary, index + N.old_dy, value * 100)
	}

	public setMass(index: number, value: number) {
		Atomics.store(this._ary, index + N.mass, value * 100)
	}

	public setConvergence(index: number, value: number) {
		Atomics.store(this._ary, index + N.convergence, value * 100)
	}

	public setSize(index: number, value: number) {
		Atomics.store(this._ary, index + N.size, value * 100)
	}

	public setFixed(index: number, value: boolean) {
		Atomics.store(this._ary, index + N.fixed, value ? 1 : 0)
	}
}
