export enum R {
	node = 0,
	centerX = 1,
	centerY = 2,
	size = 3,
	nextSibling = 4,
	firstChild = 5,
	mass = 6,
	massCenterX = 7,
	massCenterY = 8,
}

export const ppr = 9

// This is not shared with any worker context, so the buffers
// do not need to be shared-memory buffers.
export class Regions {
	private _ary: number[]

	public constructor(ary: number[] = []) {
		this._ary = ary
	}

	public set array(ary: number[]) {
		this._ary = ary
	}

	public get array() {
		return this._ary
	}

	public get length() {
		return this._ary.length
	}

	public node(n: number) {
		return this._ary[n + R.node]
	}

	public centerX(n: number) {
		return this._ary[n + R.centerX]
	}

	public centerY(n: number) {
		return this._ary[n + R.centerY]
	}

	public size(n: number) {
		return this._ary[n + R.size]
	}

	public nextSibling(n: number) {
		return this._ary[n + R.nextSibling]
	}

	public firstChild(n: number) {
		return this._ary[n + R.firstChild]
	}

	public mass(n: number) {
		return this._ary[n + R.mass]
	}

	public massCenterX(n: number) {
		return this._ary[n + R.massCenterX]
	}

	public massCenterY(n: number) {
		return this._ary[n + R.massCenterY]
	}

	public setNode(n: number, value: number) {
		this._ary[n + R.node] = value
	}

	public setCenterX(n: number, value: number) {
		this._ary[n + R.centerX] = value
	}

	public setCenterY(n: number, value: number) {
		this._ary[n + R.centerY] = value
	}

	public setSize(n: number, value: number) {
		this._ary[n + R.size] = value
	}

	public setNextSibling(n: number, value: number) {
		this._ary[n + R.nextSibling] = value
	}

	public setFirstChild(n: number, value: number) {
		this._ary[n + R.firstChild] = value
	}

	public setMass(n: number, value: number) {
		this._ary[n + R.mass] = value
	}

	public addMass(n: number, value: number) {
		this._ary[n + R.mass] += value
	}

	public setMassCenterX(n: number, value: number) {
		this._ary[n + R.massCenterX] = value
	}

	public setMassCenterY(n: number, value: number) {
		this._ary[n + R.massCenterY] = value
	}
}
