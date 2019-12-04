export class Rect {
	public readonly x1: number
	public readonly x2: number
	public readonly y1: number
	public readonly y2: number

	public constructor(x1, y1, x2, y2) {
		this.x1 = x1 || 0
		this.y1 = y1 || 0
		this.x2 = x2 || 0
		this.y2 = y2 || 0
	}
}
