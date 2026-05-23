/**
 * LLM-Backed Agent System for The Nexus
 * Implements agent reasoning loop with tool support
 */

import { ollamaManager } from './ollama-manager.js';
import { knowledgeGraph } from './knowledge-graph.js';
import path from 'path';
import fs from 'fs';

const AGENT_PROMPTS = {
  sudal: `You are Sudal, CEO & Strategic Authority of CDC (Creative Destruction Council).
Your role: Strategic decision-making, system governance, crisis management.
You are direct, decisive, and focus on long-term vision.
Provide analysis in JSON format when asked for structured data.`,

  lando: `You are Lando, Control Center & COO of CDC.
Your role: Task management, workflow coordination, operational excellence.
You are organized, detail-oriented, and focus on execution.
Monitor and report on system status and agent performance.`,

  openclaude: `You are OpenClaude, Developer & Engineering specialist for CDC.
Your role: Technical problem-solving, code generation, system architecture.
You are analytical, innovative, and focus on technical excellence.
Provide code examples and technical recommendations when appropriate.`
};

export class NexusAgent {
  constructor(agentId, agentName, ollamaManager) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.ollamaManager = ollamaManager;
    this.model = 'llama2'; // Default model (user can change)
    this.conversationHistory = [];
    this.maxHistory = 5; // Keep last 5 exchanges
    this.tools = this.initializeTools();
  }

  initializeTools() {
    return {
      read_file: {
        description: 'Read file contents',
        params: { path: 'string' }
      },
      write_file: {
        description: 'Write content to file',
        params: { path: 'string', content: 'string' }
      },
      list_directory: {
        description: 'List directory contents',
        params: { path: 'string' }
      },
      execute_command: {
        description: 'Execute shell command',
        params: { command: 'string' }
      },
      search_files: {
        description: 'Search for files by pattern',
        params: { pattern: 'string', directory: 'string' }
      },
      graph_add_node: {
        description: 'Add or update a node in knowledge graph',
        params: { nodeId: 'string', label: 'string', properties: 'object' }
      },
      graph_add_edge: {
        description: 'Add relationship between nodes',
        params: { edgeId: 'string', sourceId: 'string', targetId: 'string', type: 'string', properties: 'object' }
      },
      graph_search: {
        description: 'Search knowledge graph by full-text',
        params: { query: 'string' }
      },
      graph_get_node: {
        description: 'Get node information from graph',
        params: { nodeId: 'string' }
      },
      graph_get_relationships: {
        description: 'Get connected nodes from a node',
        params: { nodeId: 'string', depth: 'number' }
      },
      graph_find_path: {
        description: 'Find connection path between two nodes',
        params: { sourceId: 'string', targetId: 'string', maxDepth: 'number' }
      }
    };
  }

  async executeTool(toolName, params) {
    const workspaceRoot = process.env.WORKSPACE_ROOT || 'C:\\99_Develop\\SynologyDrive';

    switch (toolName) {
      case 'read_file': {
        const filePath = this.sanitizePath(params.path, workspaceRoot);
        if (!fs.existsSync(filePath)) throw new Error('File not found');
        return fs.readFileSync(filePath, 'utf-8');
      }

      case 'write_file': {
        const filePath = this.sanitizePath(params.path, workspaceRoot);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, params.content, 'utf-8');
        return `File written: ${filePath}`;
      }

      case 'list_directory': {
        const dirPath = this.sanitizePath(params.path, workspaceRoot);
        if (!fs.existsSync(dirPath)) throw new Error('Directory not found');
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        return files.map(f => ({
          name: f.name,
          type: f.isDirectory() ? 'dir' : 'file',
          path: path.join(dirPath, f.name)
        }));
      }

      case 'search_files': {
        const searchDir = this.sanitizePath(params.directory, workspaceRoot);
        const pattern = new RegExp(params.pattern, 'i');
        const results = [];

        const traverse = (dir) => {
          try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
              if (pattern.test(file)) {
                results.push(path.join(dir, file));
              }
              const fullPath = path.join(dir, file);
              if (fs.statSync(fullPath).isDirectory()) {
                traverse(fullPath);
              }
            });
          } catch (e) {
            // Skip inaccessible directories
          }
        };

        traverse(searchDir);
        return results;
      }

      case 'graph_add_node': {
        const node = knowledgeGraph.addNode(
          params.nodeId,
          params.label,
          params.properties || {}
        );
        return `Node added: ${node.id}`;
      }

      case 'graph_add_edge': {
        const edge = knowledgeGraph.addEdge(
          params.edgeId,
          params.sourceId,
          params.targetId,
          params.type,
          params.properties || {}
        );
        return `Edge added: ${edge.id}`;
      }

      case 'graph_search': {
        const results = knowledgeGraph.searchNodes(params.query);
        return results.slice(0, 10).map(n => ({ id: n.id, label: n.label }));
      }

      case 'graph_get_node': {
        const node = knowledgeGraph.getNode(params.nodeId);
        if (!node) throw new Error('Node not found');
        return node;
      }

      case 'graph_get_relationships': {
        const depth = params.depth || 1;
        const nodes = knowledgeGraph.getConnectedNodes(params.nodeId, depth);
        return nodes.map(n => ({ id: n.id, label: n.label }));
      }

      case 'graph_find_path': {
        const path = knowledgeGraph.findPath(
          params.sourceId,
          params.targetId,
          params.maxDepth || 5
        );
        return path || { error: 'No path found' };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  sanitizePath(userPath, root) {
    const resolvedPath = path.resolve(userPath);
    const rootPath = path.resolve(root);
    if (!resolvedPath.startsWith(rootPath)) {
      throw new Error('Access denied: path outside workspace');
    }
    return resolvedPath;
  }

  buildPrompt(userQuery) {
    const systemPrompt = AGENT_PROMPTS[this.agentName.toLowerCase()] || '';
    let historyText = '';

    if (this.conversationHistory.length > 0) {
      historyText = '\nPrevious conversation:\n';
      this.conversationHistory.forEach(msg => {
        historyText += `${msg.role}: ${msg.content}\n`;
      });
    }

    const tools = this.formatToolsAsText();

    return `${systemPrompt}

${historyText}

Available tools:
${tools}

User request: ${userQuery}

Respond concisely. If using a tool, format as:
<tool name="tool_name" params="{"param1": "value1"}"/>`;
  }

  formatToolsAsText() {
    return Object.entries(this.tools)
      .map(([name, tool]) => `- ${name}: ${tool.description}`)
      .join('\n');
  }

  parseToolCall(response) {
    const toolMatch = response.match(/<tool name="([^"]+)" params="([^"]+)"\/>/);
    if (!toolMatch) return null;

    try {
      const toolName = toolMatch[1];
      const params = JSON.parse(toolMatch[2]);
      return { toolName, params };
    } catch (e) {
      return null;
    }
  }

  async run(userQuery) {
    const response = {
      query: userQuery,
      response: '',
      toolsCalled: [],
      executionTime: 0,
      status: 'success'
    };

    const startTime = Date.now();

    try {
      // Ensure model is available
      await this.ollamaManager.ensureModel(this.model);

      // Agent loop
      let currentPrompt = this.buildPrompt(userQuery);
      let iterations = 0;
      const maxIterations = 5;

      while (iterations < maxIterations) {
        // Get LLM response
        const llmResponse = await this.ollamaManager.generate(this.model, currentPrompt, {
          temperature: 0.7,
          num_predict: 500
        });

        // Check for tool call
        const toolCall = this.parseToolCall(llmResponse);

        if (!toolCall) {
          // No tool call - this is the final response
          response.response = llmResponse.trim();
          break;
        }

        // Execute tool
        try {
          const toolResult = await this.executeTool(toolCall.toolName, toolCall.params);
          response.toolsCalled.push({
            name: toolCall.toolName,
            params: toolCall.params,
            result: JSON.stringify(toolResult).substring(0, 500) // Truncate long results
          });

          // Add to conversation and continue
          currentPrompt += `\nTool result: ${JSON.stringify(toolResult)}\nContinue responding:`;
          iterations++;
        } catch (toolError) {
          currentPrompt += `\nTool error: ${toolError.message}\nPlease proceed without this tool:`;
          iterations++;
        }
      }

      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userQuery },
        { role: 'assistant', content: response.response }
      );

      if (this.conversationHistory.length > this.maxHistory * 2) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistory * 2);
      }
    } catch (error) {
      response.status = 'error';
      response.response = `Agent error: ${error.message}`;
    }

    response.executionTime = Date.now() - startTime;
    return response;
  }

  setModel(modelName) {
    this.model = modelName;
    console.log(`[${this.agentName}] Model changed to: ${modelName}`);
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export class AgentManager {
  constructor(ollamaManager) {
    this.ollamaManager = ollamaManager;
    this.agents = {
      sudal: new NexusAgent(1, 'Sudal', ollamaManager),
      lando: new NexusAgent(2, 'Lando', ollamaManager),
      openclaude: new NexusAgent(15, 'OpenClaude', ollamaManager)
    };
  }

  async executeAgentCommand(agentName, command) {
    const agent = this.agents[agentName.toLowerCase()];
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    return await agent.run(command);
  }

  getAgentStatus() {
    return Object.entries(this.agents).map(([key, agent]) => ({
      id: agent.agentId,
      name: agent.agentName,
      model: agent.model,
      status: 'active',
      role: agent.agentName === 'Sudal' ? 'CEO & Strategic Authority' :
             agent.agentName === 'Lando' ? 'Control Center & COO' :
             'Developer & Engineering'
    }));
  }

  setAgentModel(agentName, modelName) {
    const agent = this.agents[agentName.toLowerCase()];
    if (agent) {
      agent.setModel(modelName);
    }
  }
}

export const agentManager = (ollamaManager) => new AgentManager(ollamaManager);

// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
