#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMilestone1() {
  console.log('🧪 Testing Milestone 1: Basic MCP Server');

  // Start the server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await setTimeout(2000);

  // Test 1: tools/list request
  console.log('📋 Testing tools/list request...');

  const toolsListRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  };

  let responseData = '';
  let errorData = '';

  server.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  // Send request
  server.stdin.write(JSON.stringify(toolsListRequest) + '\n');

  // Wait for response
  await setTimeout(1000);

  try {
    // Extract JSON from the response (skip npm output)
    const jsonMatch = responseData.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const response = JSON.parse(jsonMatch[0]);

    console.log('✅ Server responded to tools/list');
    console.log(`📊 Found ${response.result.tools.length} tools:`);

    response.result.tools.forEach((tool) => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });

    // Verify expected tools
    const toolNames = response.result.tools.map((tool) => tool.name);
    const expectedTools = ['search_components', 'get_component', 'list_components'];

    const allPresent = expectedTools.every((tool) => toolNames.includes(tool));

    if (allPresent) {
      console.log('✅ All expected tools are present');
    } else {
      console.log('❌ Missing expected tools');
      console.log('Expected:', expectedTools);
      console.log('Found:', toolNames);
    }
  } catch (error) {
    console.log('❌ Failed to parse response:', error.message);
    console.log('Response data:', responseData);
    console.log('Error data:', errorData);
  }

  // Test 2: Invalid tool call
  console.log('\n🔧 Testing invalid tool call...');

  const invalidRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'invalid_tool',
      arguments: {},
    },
  };

  responseData = '';
  server.stdin.write(JSON.stringify(invalidRequest) + '\n');
  await setTimeout(1000);

  try {
    // Extract JSON from the response (skip npm output)
    const jsonMatch = responseData.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const response = JSON.parse(jsonMatch[0]);

    if (response.error) {
      console.log('✅ Server correctly returned error for invalid tool');
      console.log(`   Error: ${response.error.message}`);
    } else {
      console.log('❌ Server should have returned an error');
    }
  } catch (error) {
    console.log('❌ Failed to parse error response:', error.message);
  }

  // Cleanup
  server.kill();
  console.log('\n🎉 Milestone 1 test completed!');
}

testMilestone1().catch(console.error);
