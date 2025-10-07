import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { setTimeout } from 'timers/promises';

describe('Milestone 1: Basic MCP Server', () => {
  let serverProcess: ChildProcess | null = null;
  const SERVER_STARTUP_TIME = 2000; // 2 seconds

  beforeAll(async () => {
    // Start the server process
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    // Wait for server to start
    await setTimeout(SERVER_STARTUP_TIME);
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should start without errors', () => {
    expect(serverProcess).toBeTruthy();
    expect(serverProcess?.killed).toBe(false);
  });

  it('should respond to tools/list request', async () => {
    if (!serverProcess) {
      throw new Error('Server process not started');
    }

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };

    return new Promise<void>((resolve, reject) => {
      let responseData = '';
      let errorData = '';

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      serverProcess!.stdout?.on('data', (data) => {
        responseData += data.toString();
      });

      serverProcess!.stderr?.on('data', (data) => {
        errorData += data.toString();
      });

      serverProcess!.stdin?.write(JSON.stringify(request) + '\n');

      // Wait a bit for response
      setTimeout(1000).then(() => {
        clearTimeout(timeout);

        try {
          const response = JSON.parse(responseData);

          // Verify response structure
          expect(response.jsonrpc).toBe('2.0');
          expect(response.id).toBe(1);
          expect(response.result).toBeDefined();
          expect(response.result.tools).toBeDefined();
          expect(Array.isArray(response.result.tools)).toBe(true);

          // Verify we have the expected tools
          const toolNames = response.result.tools.map((tool: any) => tool.name);
          expect(toolNames).toContain('search_components');
          expect(toolNames).toContain('get_component');
          expect(toolNames).toContain('list_components');
          expect(toolNames).toHaveLength(3);

          resolve();
        } catch (error) {
          reject(
            new Error(
              `Failed to parse response: ${error}. Response: ${responseData}, Errors: ${errorData}`,
            ),
          );
        }
      });
    });
  });

  it('should handle invalid tool calls gracefully', async () => {
    if (!serverProcess) {
      throw new Error('Server process not started');
    }

    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'invalid_tool',
        arguments: {},
      },
    };

    return new Promise<void>((resolve, reject) => {
      let responseData = '';

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      serverProcess!.stdout?.on('data', (data) => {
        responseData += data.toString();
      });

      serverProcess!.stdin?.write(JSON.stringify(request) + '\n');

      setTimeout(1000).then(() => {
        clearTimeout(timeout);

        try {
          const response = JSON.parse(responseData);

          // Should return an error for invalid tool
          expect(response.error).toBeDefined();
          expect(response.error.message).toContain('Unknown tool');

          resolve();
        } catch (error) {
          reject(new Error(`Failed to parse error response: ${error}. Response: ${responseData}`));
        }
      });
    });
  });
});
