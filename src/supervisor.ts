import { Rect } from './Rect'
import { ppe, ppn, NodeStore, Node, EdgeStore, Edge } from './core/marshaling'

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
	private _graphRect: Rect = new Rect(
		Number.MAX_VALUE,
		Number.MAX_VALUE,
		Number.MIN_VALUE,
		Number.MIN_VALUE,
	)
	private config: FA2Configuration
	private _nodes: NodeStore
	private _edges: EdgeStore

	public constructor(graph, config: Partial<FA2Configuration>) {
		this.graph = graph
		const workerBlob = new Blob([workerScript], { type: 'text/javascript' })
		this.worker = new Worker(window.URL.createObjectURL(workerBlob))
		this.worker.addEventListener('message', this.onMessage)

		// Create supervisor if undefined
		this.configure(config)

		// Filling byteArrays
		this._nodes = new NodeStore(
			new Float32Array(new SharedArrayBuffer(4 * ppn * graph.nodes.length)),
		)
		this._edges = new EdgeStore(
			new Float32Array(new SharedArrayBuffer(4 * ppe * graph.edges.length)),
		)
		this.packGraphBuffers()
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
			this.sendDataToWorker('start')
			this.started = true
		} else {
			this.sendDataToWorker()
		}
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

	public forceUpdate() {
		if (!this._pending) {
			this.packNodeBuffer()
		} else {
			this._needUpdate = true
		}
	}

	private onMessage = () => {
		// Retrieving data
		this.applyLayoutUpdate()
		this._pending = false
	}

	private packGraphBuffers() {
		const { nodes, edges } = this.graph
		// A lookup map of node id (string) to index
		let nodeIdToIndex: Record<string, number> = {}
		this.packNodeBuffer()

		for (let i = 0, l = nodes.length; i < l; i++) {
			// Populating index
			nodeIdToIndex[nodes[i].id] = i
		}

		// Iterate through edges
		let bufferEdge: Edge
		let sourceEdge: any
		let source: number
		let target: number
		let weight: number
		for (let i = 0, l = edges.length; i < l; i++) {
			sourceEdge = edges[i]
			bufferEdge = this._edges.getEdge(i)
			source = nodeIdToIndex[sourceEdge.fromId]
			target = nodeIdToIndex[sourceEdge.toId]
			weight = sourceEdge.weight || 1

			bufferEdge.source = source
			bufferEdge.target = target
			bufferEdge.weight = weight
		}
	}

	private packNodeBuffer() {
		let minX = Number.MAX_VALUE
		let maxX = Number.MIN_VALUE
		let minY = Number.MAX_VALUE
		let maxY = Number.MIN_VALUE
		let x: number
		let y: number
		let node: Node

		for (let i = 0; i < this.graph.nodes.length; ++i) {
			const inputNode = this.graph.nodes[i]
			node = this._nodes.getNode(i)
			node.x = x = inputNode.x
			node.y = y = inputNode.y
			node.mass = this.graph.degree[inputNode.id]
			node.convergence = 1
			node.size = inputNode.size || 0
			node.fixed = inputNode.isPinned

			if (minX > x) minX = x
			if (maxX < x) maxX = x
			if (minY > y) minY = y
			if (maxY < y) maxY = y
		}
		this._graphRect = new Rect(minX, minY, maxX, maxY)
	}

	private applyLayoutUpdate() {
		const { nodes } = this.graph
		let x: number
		let y: number
		let bufferNode: Node

		let minX = Number.MAX_VALUE,
			maxX = Number.MIN_VALUE,
			minY = Number.MAX_VALUE,
			maxY = Number.MIN_VALUE

		// Moving nodes
		for (let i = 0, l = this._nodes.nodeCount; i < l; i++) {
			bufferNode = this._nodes.getNode(i)
			if (!nodes[i].changed) {
				nodes[i].x = x = bufferNode.x
				nodes[i].y = y = bufferNode.y
			} else {
				bufferNode.x = x = nodes[i].x
				bufferNode.y = y = nodes[i].y
				bufferNode.fixed = nodes[i].isPinned
				nodes[i].changed = false
			}

			if (minX > x) minX = x
			if (maxX < x) maxX = x
			if (minY > y) minY = y
			if (maxY < y) maxY = y
		}

		this._graphRect = new Rect(minX, minY, maxX, maxY)
	}

	private sendDataToWorker(action?: string) {
		this.worker.postMessage({
			action: action || 'loop',
			nodes: this._nodes.array.buffer,
			edges: this._edges.array.buffer,
		})
		this._pending = true
	}
}
