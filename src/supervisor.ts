import { Rect } from './Rect'
import { ppe, ppn } from './algorithm'
// @ts-ignore
import workerScript from 'raw-loader!!../dist/fa2_worker.js'
import { FA2Configuration, DEFAULT_CONFIGURATION } from './configuration'

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
	private nodesByteArray: Uint32Array
	private edgesByteArray: Uint32Array

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

		const nodeBuffer = new SharedArrayBuffer(4 * nbytes)
		const edgeBuffer = new SharedArrayBuffer(4 * ebytes)
		const nodeArray = new Uint32Array(nodeBuffer)
		const edgeArray = new Uint32Array(edgeBuffer)

		for (let i = 0; i < nodes.length; ++i) {
			Atomics.store(nodeArray, i, nodes[i] * 100)
		}
		for (let i = 0; i < nodes.length; ++i) {
			Atomics.store(edgeArray, i, nodes[i] * 100)
		}

		this.nodesByteArray = nodeArray
		this.edgesByteArray = edgeArray

		// Iterate through nodes
		this._refreshNodesByteArray()

		// Populating Node id->index map
		for (let i = 0, j = 0, l = nodes.length; i < l; i++, j += ppn) {
			nIndex[nodes[i].id] = j
		}

		// Pack edge data
		for (let i = 0, j = 0, l = edges.length; i < l; i++, j += ppe) {
			this.edgesByteArray[j] = nIndex[edges[i].fromId]
			this.edgesByteArray[j + 1] = nIndex[edges[i].toId]
			this.edgesByteArray[j + 2] = (edges[i].weight || 1) * 100
		}
	}

	_refreshNodesByteArray() {
		let minX = Number.MAX_VALUE,
			maxX = Number.MIN_VALUE,
			minY = Number.MAX_VALUE,
			maxY = Number.MIN_VALUE,
			nodes = this.graph.nodes,
			x,
			y

		for (let i = 0, j = 0, l = nodes.length; i < l; i++, j += ppn) {
			var node = nodes[i]
			// Populating byte array
			this.nodesByteArray[j] = x = node.x * 100
			this.nodesByteArray[j + 1] = y = node.y * 100
			this.nodesByteArray[j + 2] = 0
			this.nodesByteArray[j + 3] = 0
			this.nodesByteArray[j + 4] = 0
			this.nodesByteArray[j + 5] = 0
			this.nodesByteArray[j + 6] = 1 + this.graph.degree[node.id]
			this.nodesByteArray[j + 7] = 1
			this.nodesByteArray[j + 8] = (node.size || 0) * 100
			this.nodesByteArray[j + 9] = node.isPinned

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
		for (var i = 0, l = this.nodesByteArray.length; i < l; i += ppn) {
			if (!nodes[j].changed) {
				nodes[j].x = x = this.nodesByteArray[i] * 100
				nodes[j].y = y = this.nodesByteArray[i + 1] * 100
			} else {
				this.nodesByteArray[i] = x = nodes[j].x * 100
				this.nodesByteArray[i + 1] = y = nodes[j].y * 100
				this.nodesByteArray[i + 9] = nodes[j].isPinned
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
			nodes: this.nodesByteArray.buffer,
		}

		if (action === 'start') {
			content.config = this.config || {}
			content.edges = this.edgesByteArray.buffer
		}

		this.worker.postMessage(content)
		this._pending = true
	}
}
