/**
 * Knowledge Graph Engine for The Nexus
 * Simple graph database backed by JSON files with full-text search
 * Integrates with agent system as queryable tools
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export class KnowledgeGraph {
  constructor(dataPath = '.nexus-graph') {
    this.dataPath = dataPath;
    this.graphFile = path.join(dataPath, 'graph.json');
    this.indexFile = path.join(dataPath, 'index.json');
    this.initializeStorage();
  }

  initializeStorage() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    if (!fs.existsSync(this.graphFile)) {
      this.saveGraph({ nodes: [], edges: [] });
    }

    if (!fs.existsSync(this.indexFile)) {
      this.saveIndex({ nodes: {}, edges: {} });
    }
  }

  loadGraph() {
    const data = fs.readFileSync(this.graphFile, 'utf-8');
    return JSON.parse(data);
  }

  saveGraph(graph) {
    fs.writeFileSync(this.graphFile, JSON.stringify(graph, null, 2), 'utf-8');
  }

  loadIndex() {
    const data = fs.readFileSync(this.indexFile, 'utf-8');
    return JSON.parse(data);
  }

  saveIndex(index) {
    fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2), 'utf-8');
  }

  // Add or update a node
  addNode(nodeId, label, properties = {}) {
    const graph = this.loadGraph();
    const index = this.loadIndex();

    const existingNode = graph.nodes.find(n => n.id === nodeId);
    const node = {
      id: nodeId,
      label,
      properties,
      createdAt: existingNode?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingNode) {
      Object.assign(existingNode, node);
    } else {
      graph.nodes.push(node);
    }

    // Update full-text search index
    const searchTerms = [label, ...Object.values(properties)].join(' ').toLowerCase().split(/\s+/);
    index.nodes[nodeId] = { label, terms: searchTerms };

    this.saveGraph(graph);
    this.saveIndex(index);
    return node;
  }

  // Add or update an edge (relationship)
  addEdge(edgeId, sourceId, targetId, type, properties = {}) {
    const graph = this.loadGraph();
    const index = this.loadIndex();

    // Verify nodes exist
    if (!graph.nodes.find(n => n.id === sourceId) || !graph.nodes.find(n => n.id === targetId)) {
      throw new Error('Source or target node not found');
    }

    const existingEdge = graph.edges.find(e => e.id === edgeId);
    const edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type,
      properties,
      createdAt: existingEdge?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingEdge) {
      Object.assign(existingEdge, edge);
    } else {
      graph.edges.push(edge);
    }

    index.edges[edgeId] = { type, source: sourceId, target: targetId };

    this.saveGraph(graph);
    this.saveIndex(index);
    return edge;
  }

  // Query: Find node by ID
  getNode(nodeId) {
    const graph = this.loadGraph();
    return graph.nodes.find(n => n.id === nodeId);
  }

  // Query: Search nodes by full-text
  searchNodes(query) {
    const graph = this.loadGraph();
    const queryTerms = query.toLowerCase().split(/\s+/);

    return graph.nodes.filter(node => {
      const nodeText = `${node.label} ${JSON.stringify(node.properties)}`.toLowerCase();
      return queryTerms.every(term => nodeText.includes(term));
    });
  }

  // Query: Get all nodes of a type
  getNodesByLabel(label) {
    const graph = this.loadGraph();
    return graph.nodes.filter(n => n.label === label);
  }

  // Query: Get relationships from a node
  getNodeRelationships(nodeId) {
    const graph = this.loadGraph();
    return {
      outgoing: graph.edges.filter(e => e.source === nodeId),
      incoming: graph.edges.filter(e => e.target === nodeId)
    };
  }

  // Query: Get all connected nodes (neighbors)
  getConnectedNodes(nodeId, depth = 1) {
    const graph = this.loadGraph();
    const visited = new Set();
    const queue = [{ id: nodeId, depth: 0 }];
    const results = [];

    while (queue.length > 0) {
      const { id, depth: currentDepth } = queue.shift();
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      const node = graph.nodes.find(n => n.id === id);
      if (node) results.push(node);

      if (currentDepth < depth) {
        const edges = graph.edges.filter(e => e.source === id || e.target === id);
        edges.forEach(edge => {
          const nextId = edge.source === id ? edge.target : edge.source;
          queue.push({ id: nextId, depth: currentDepth + 1 });
        });
      }
    }

    return results;
  }

  // Query: Get all edges
  getEdges(sourceId = null, targetId = null, type = null) {
    const graph = this.loadGraph();
    return graph.edges.filter(e => {
      if (sourceId && e.source !== sourceId) return false;
      if (targetId && e.target !== targetId) return false;
      if (type && e.type !== type) return false;
      return true;
    });
  }

  // Query: Get path between two nodes (simple BFS)
  findPath(sourceId, targetId, maxDepth = 5) {
    const graph = this.loadGraph();
    const queue = [{ id: sourceId, path: [sourceId] }];
    const visited = new Set([sourceId]);

    while (queue.length > 0) {
      const { id, path } = queue.shift();
      if (path.length > maxDepth) continue;
      if (id === targetId) return path;

      const edges = graph.edges.filter(e => e.source === id || e.target === id);
      edges.forEach(edge => {
        const nextId = edge.source === id ? edge.target : edge.source;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      });
    }

    return null; // No path found
  }

  // Export graph as markdown
  exportAsMarkdown() {
    const graph = this.loadGraph();
    let markdown = '# Knowledge Graph\n\n';

    markdown += '## Nodes\n\n';
    graph.nodes.forEach(node => {
      markdown += `### ${node.label} (${node.id})\n`;
      markdown += `- Created: ${node.createdAt}\n`;
      markdown += `- Updated: ${node.updatedAt}\n`;
      if (Object.keys(node.properties).length > 0) {
        markdown += `- Properties:\n`;
        Object.entries(node.properties).forEach(([key, val]) => {
          markdown += `  - ${key}: ${val}\n`;
        });
      }
      markdown += '\n';
    });

    markdown += '\n## Relationships\n\n';
    graph.edges.forEach(edge => {
      markdown += `- **${edge.type}**: ${edge.source} → ${edge.target}\n`;
      if (Object.keys(edge.properties).length > 0) {
        markdown += `  - Properties: ${JSON.stringify(edge.properties)}\n`;
      }
    });

    return markdown;
  }

  // Import from markdown (simple format)
  importFromMarkdown(markdown) {
    const graph = this.loadGraph();
    const lines = markdown.split('\n');

    for (const line of lines) {
      // Parse node definitions: ### Label (id)
      const nodeMatch = line.match(/^### (.+) \((.+)\)$/);
      if (nodeMatch) {
        this.addNode(nodeMatch[2], nodeMatch[1]);
        continue;
      }

      // Parse relationship definitions: - type: source → target
      const edgeMatch = line.match(/^- \*\*(.+?)\*\*: (.+?) → (.+)$/);
      if (edgeMatch) {
        const edgeId = `${edgeMatch[2]}_${edgeMatch[1]}_${edgeMatch[3]}`;
        this.addEdge(edgeId, edgeMatch[2], edgeMatch[3], edgeMatch[1]);
      }
    }
  }

  // Statistics
  getStats() {
    const graph = this.loadGraph();
    return {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      nodeTypes: [...new Set(graph.nodes.map(n => n.label))],
      relationshipTypes: [...new Set(graph.edges.map(e => e.type))],
      lastModified: fs.statSync(this.graphFile).mtime
    };
  }
}

const KG_DATA_PATH = path.join(process.env.LOCALAPPDATA || os.homedir(), 'TheNexus', 'graph');
let _kgInstance = null;
try {
  _kgInstance = new KnowledgeGraph(KG_DATA_PATH);
} catch (e) {
  try {
    _kgInstance = new KnowledgeGraph(path.join(os.tmpdir(), 'TheNexus', 'graph'));
  } catch (e2) {
    _kgInstance = null;
  }
}
export const knowledgeGraph = _kgInstance;

// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
