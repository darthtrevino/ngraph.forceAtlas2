import { Rect } from './Rect';
import workerScript from 'raw-loader!!../dist/fa2_worker.js'

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
  constructor(graph, config) {
    const workerBlob = new Blob([workerScript], { type: 'text/javascript' })
    this.worker = new Worker(window.URL.createObjectURL(workerBlob))

    // Create supervisor if undefined
    this._init(graph, config);

    // Configuration provided?
    this.configure(config);

    this.run = this.start;
  }

  configure(config) {
    // Setting configuration
    this.config = config;

    if (!this.started) return;

    const data = { action: "config", config: this.config };

    this.worker.postMessage(data);
  }

  start() {
    if (this.running) return;
    this.running = true;

    if (!this.started) {
      // Sending init message to worker
      this._sendByteArrayToWorker("start");
      this.started = true;
    } else this._sendByteArrayToWorker();
  }

  killWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  step() {
    if (this.isPending()) return;
    this.start();
    this.stop();
    return false;
  }

  stop() {
    if (!this.running) return;
    this.running = false;
  }

  kill() {
    if (!this.supervisor) return this;

    // Stop Algorithm
    this.supervisor.stop();

    // Kill Worker
    this.supervisor.killWorker();

    // Kill supervisor
    this.supervisor = null;

    return this;
  }

  getGraphRect() {
    return this.graphRect;
  }

  isRunning() {
    return this.running;
  }

  isPending() {
    return this._pending;
  }

  forceUpdate() {
    if (!this._pending) this._refreshNodesByteArray();
    else this._needUpdate = true;
  }

  _init(graph, options) {
    options = options || {};

    // Properties
    this.graph = graph;
    this.ppn = 10;
    this.ppe = 3;
    this.config = {};

    // State
    this.started = false;
    this.running = false;
    this._pending = false;

    // Worker message receiver
    var listener = this._onMessage.bind(this);
    this.worker.addEventListener('message', listener);
    this.graphRect = new Rect(
      Number.MAX_VALUE,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      Number.MIN_VALUE
    );
    // Filling byteArrays
    this._graphToByteArrays();
  }

  _onMessage(e) {
    // Retrieving data
    this.nodesByteArray = new Float32Array(e.data.nodes);

    this._applyLayoutChanges();

    this._pending = false;
    // If ForceAtlas2 is running, we act accordingly
    if (this.running) {
      // Send data back to worker and loop
      this._sendByteArrayToWorker();
    }
  }

  _graphToByteArrays() {
    var nodes = this.graph.nodes,
      edges = this.graph.edges,
      nbytes = nodes.length * this.ppn,
      ebytes = edges.length * this.ppe,
      nIndex = {},
      i,
      j,
      l;

    // Allocating Byte arrays with correct nb of bytes
    this.nodesByteArray = new Float32Array(nbytes);
    this.edgesByteArray = new Float32Array(ebytes);

    // Iterate through nodes
    this._refreshNodesByteArray();

    for (i = j = 0, l = nodes.length; i < l; i++, j += this.ppn)
      // Populating index
      nIndex[nodes[i].id] = j;

    // Iterate through edges
    for (i = j = 0, l = edges.length; i < l; i++) {
      this.edgesByteArray[j] = nIndex[edges[i].fromId];
      this.edgesByteArray[j + 1] = nIndex[edges[i].toId];
      this.edgesByteArray[j + 2] = edges[i].weight || 1;
      j += this.ppe;
    }
  }

  _refreshNodesByteArray() {
    var minX = Number.MAX_VALUE,
      maxX = Number.MIN_VALUE,
      minY = Number.MAX_VALUE,
      maxY = Number.MIN_VALUE,
      nodes = this.graph.nodes,
      x,
      y,
      i,
      l,
      j;

    for (i = j = 0, l = nodes.length; i < l; i++) {
      var node = nodes[i];
      // Populating byte array
      this.nodesByteArray[j] = x = node.x;
      this.nodesByteArray[j + 1] = y = node.y;
      this.nodesByteArray[j + 2] = 0;
      this.nodesByteArray[j + 3] = 0;
      this.nodesByteArray[j + 4] = 0;
      this.nodesByteArray[j + 5] = 0;
      this.nodesByteArray[j + 6] = 1 + this.graph.degree[node.id];
      this.nodesByteArray[j + 7] = 1;
      this.nodesByteArray[j + 8] = node.size || 0;
      this.nodesByteArray[j + 9] = node.isPinned;
      j += this.ppn;

      if (minX > x) minX = x;
      if (maxX < x) maxX = x;
      if (minY > y) minY = y;
      if (maxY < y) maxY = y;
    }

    this.graphRect = new Rect(minX, minY, maxX, maxY);
  }

  _applyLayoutChanges() {
    var nodes = this.graph.nodes,
      j = 0,
      x,
      y;

    var minX = Number.MAX_VALUE,
      maxX = Number.MIN_VALUE,
      minY = Number.MAX_VALUE,
      maxY = Number.MIN_VALUE;

    // Moving nodes
    for (var i = 0, l = this.nodesByteArray.length; i < l; i += this.ppn) {
      if (!nodes[j].changed) {
        nodes[j].x = x = this.nodesByteArray[i];
        nodes[j].y = y = this.nodesByteArray[i + 1];
      } else {
        this.nodesByteArray[i] = x = nodes[j].x;
        this.nodesByteArray[i + 1] = y = nodes[j].y;
        this.nodesByteArray[i + 9] = nodes[j].isPinned;
        nodes[j].changed = false;
      }

      if (minX > x) minX = x;
      if (maxX < x) maxX = x;
      if (minY > y) minY = y;
      if (maxY < y) maxY = y;

      j++;
    }

    this.graphRect = new Rect(minX, minY, maxX, maxY);
  }

  _sendByteArrayToWorker(action) {
    var content = {
      action: action || "loop",
      nodes: this.nodesByteArray.buffer
    };

    var buffers = [this.nodesByteArray.buffer];

    if (action === "start") {
      content.config = this.config || {};
      content.edges = this.edgesByteArray.buffer;
      buffers.push(this.edgesByteArray.buffer);
    }

    this.worker.postMessage(content, buffers);
    this._pending = true;
  }
}
