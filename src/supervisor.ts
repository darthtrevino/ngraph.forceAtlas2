import { Rect } from './Rect'
import { ppe, E, Edges } from './core/Edges'
import { ppn, N, Nodes } from './core/Nodes'
// @ts-ignore
import workerScript from 'raw-loader!!../dist/fa2_worker.js'
import { FA2Configuration, DEFAULT_CONFIGURATION } from './core/configuration'

/**
 * Sigma ForceAtlas2.5 Supervisor
 * ===============================
 *
 * Author: Guillaume Plique (Yomguithereal)
 * Version: 0.1
 */

/**
 * Supervisor Object
 * ------------------
 */
export class Supervisor {
	private graph: any
	private worker: Worker
	private running: boolean = false
	private started: boolean = false
	private _pending: boolean = false
	// TODO this doesn't appear to be used
	private _needUpdate: boolean = false
	private _graphRect: Rect
	private config: FA2Configuration
	private nodes: Nodes
	private edges: Edges

	public constructor(graph, config: Partial<FA2Configuration>) {
		this.graph = graph
		const workerBlob = new Blob([workerScript], { type: 'text/javascript' })
		this.worker = new Worker(window.URL.createObjectURL(workerBlob))
		this.worker.addEventListener('message', this._onMessage.bind(this))
		this._graphRect = new Rect(
			Number.MAX_VALUE,
			Number.MAX_VALUE,
			Number.MIN_VALUE,
			Number.MIN_VALUE,
		)

		// Create supervisor if undefined
		this.configure(config)

		// Filling byteArrays
		this._graphToByteArrays()
	}

	public configure(config: Partial<FA2Configuration>) {
		this.config = { ...DEFAULT_CONFIGURATION, ...config }
		if (!this.started) return
		const data = { action: 'config', config: this.config }
		this.worker.postMessage(data)
	}

	public start() {
		if (this.running) return
		this.running = true

		if (!this.started) {
			// Sending init message to worker
			this._sendByteArrayToWorker('start')
			this.started = true
		} else this._sendByteArrayToWorker()
	}

	public step() {
		if (this.isPending) {
			return
		}
		this.start()
		this.stop()
		return false
	}

	public stop() {
		if (!this.running) {
			return
		}
		this.running = false
	}

	public kill() {
		if (this.worker) {
			this.worker.terminate()
		}
	}

	public get graphRect(): Rect {
		return this._graphRect
	}

	public get isRunning(): boolean {
		return this.running
	}

	public get isPending(): boolean {
		return this._pending
	}

	forceUpdate() {
		if (!this._pending) {
			this._refreshNodesByteArray()
		} else {
			this._needUpdate = true
		}
	}

	_onMessage(e) {
		// Retrieving data
		this._applyLayoutChanges()

		this._pending = false
		// If ForceAtlas2 is running, we act accordingly
		if (this.running) {
			// Send data back to worker and loop
			this._sendByteArrayToWorker()
		}
	}

	_graphToByteArrays() {
		const { nodes, edges } = this.graph
		const nbytes = nodes.length * ppn * 4
		const ebytes = edges.length * ppe * 4
		const nIndex: Record<string, number> = {}

		const nodeArray = new Uint32Array(new SharedArrayBuffer(4 * nbytes))
		const edgeArray = new Uint32Array(new SharedArrayBuffer(4 * ebytes))
		this.nodes = new Nodes(nodeArray)
		this.edges = new Edges(edgeArray)

		// Iterate through nodes
		this._refreshNodesByteArray()

		// Populating Node id->index map
		for (let i = 0, j = 0, l = nodes.length; i < l; i++, j += ppn) {
			nIndex[nodes[i].id] = j
		}

		// Pack edge data
		for (let i = 0, j = 0, l = edges.length; i < l; i++, j += ppe) {
			this.edges.setSource(j, nIndex[edges[i].fromId])
			this.edges.setTarget(j, nIndex[edges[i].toId])
			this.edges.setWeight(j, edges[i].weight || 1)
		}
	}

	_refreshNodesByteArray() {
		let minX = Number.MAX_VALUE,
			maxX = Number.MIN_VALUE,
			minY = Number.MAX_VALUE,
			maxY = Number.MIN_VALUE,
			nodes = this.graph.nodes,
			x,
			y,
			node

		for (let i = 0, j = 0, l = nodes.length; i < l; i++, j += ppn) {
			node = nodes[i]
			x = node.min
			y = node.y

			// Populating byte array
			this.nodes.setX(j, node.x)
			this.nodes.setY(j, node.y)
			this.nodes.setDx(j, 0)
			this.nodes.setDy(j, 0)
			this.nodes.setOldDx(j, 0)
			this.nodes.setOldDy(j, 0)
			this.nodes.setMass(j, 1 + this.graph.degree[node.id])
			this.nodes.setConvergence(j, 1)
			this.nodes.setSize(j, node.size || 0)
			this.nodes.setFixed(j, node.isPinned)

			if (minX > x) minX = x
			if (maxX < x) maxX = x
			if (minY > y) minY = y
			if (maxY < y) maxY = y
		}

		this._graphRect = new Rect(minX, minY, maxX, maxY)
	}

	_applyLayoutChanges() {
		var nodes = this.graph.nodes,
			j = 0,
			x,
			y

		var minX = Number.MAX_VALUE,
			maxX = Number.MIN_VALUE,
			minY = Number.MAX_VALUE,
			maxY = Number.MIN_VALUE

		// Moving nodes
		for (var i = 0, l = this.nodes.length; i < l; i += ppn) {
			if (!nodes[j].changed) {
				nodes[j].x = x = this.nodes.x(i)
				nodes[j].y = y = this.nodes.y(i)
				x = nodes[j].x
				y = nodes[j].y
			} else {
				x = nodes[j].x
				y = nodes[j].y
				this.nodes.setX(i, nodes[j].x)
				this.nodes.setY(i, nodes[j].y)
				this.nodes.setFixed(i, nodes[j].isPinned)
				nodes[j].changed = false
			}

			if (minX > x) minX = x
			if (maxX < x) maxX = x
			if (minY > y) minY = y
			if (maxY < y) maxY = y

			j++
		}

		this._graphRect = new Rect(minX, minY, maxX, maxY)
	}

	_sendByteArrayToWorker(action?: string) {
		const content: Record<string, any> = {
			action: action || 'loop',
			nodes: this.nodes.array.buffer,
		}

		if (action === 'start') {
			content.config = this.config || {}
			content.edges = this.edges.array.buffer
		}

		this.worker.postMessage(content)
		this._pending = true
	}
}
