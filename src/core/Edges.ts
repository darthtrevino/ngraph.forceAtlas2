export enum E {
	source = 0,
	target = 1,
	weight = 2,
}

export const ppe = 3

export class Edges {
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

	public source(index: number): number {
		return this._ary[index + E.source]
	}

	public target(index: number) {
		return this._ary[index + E.target]
	}

	public weight(index: number) {
		return this._ary[index + E.weight] / 100
	}

	public setSource(index: number, value: number) {
		Atomics.store(this._ary, index + E.source, value)
	}

	public setTarget(index: number, value: number) {
		Atomics.store(this._ary, index + E.target, value)
	}

	public setWeight(index: number, value: number) {
		Atomics.store(this._ary, index + E.weight, value * 100)
	}
}
