#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMilestone2() {
  console.log('🧪 Testing Milestone 2: Component Data Fetching\n');

  // Start the server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await setTimeout(2000);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Fetch a specific component
  console.log('📦 Test 1: Fetching input component...');

  const getComponentRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'get_component',
      arguments: { name: 'input' },
    },
  };

  let responseData = '';
  let errorData = '';

  server.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  server.stdin.write(JSON.stringify(getComponentRequest) + '\n');
  await setTimeout(5000); // Wait longer for GitHub fetch

  try {
    const jsonMatch = responseData.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const response = JSON.parse(jsonMatch[0]);

    if (response.result && response.result.content) {
      const content = JSON.parse(response.result.content[0].text);

      if (content.name === 'Input') {
        console.log('✅ Successfully fetched Input component');
        console.log(`   Props: ${Object.keys(content.props).length}`);
        console.log(`   Data Attributes: ${Object.keys(content.dataAttributes).length}`);
        testsPassed++;
      } else {
        console.log('❌ Component data structure incorrect');
        testsFailed++;
      }
    } else {
      console.log('❌ Failed to fetch component');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error parsing response:', error.message);
    console.log('Response:', responseData.slice(-500));
    testsFailed++;
  }

  // Test 2: Search for components
  console.log('\n🔍 Test 2: Searching for "dialog" components...');

  responseData = '';
  const searchRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'search_components',
      arguments: { query: 'dialog', limit: 5 },
    },
  };

  server.stdin.write(JSON.stringify(searchRequest) + '\n');
  await setTimeout(3000);

  try {
    const jsonMatch = responseData.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const response = JSON.parse(jsonMatch[0]);

    if (response.result && response.result.content) {
      const content = JSON.parse(response.result.content[0].text);

      if (content.components && content.components.length > 0) {
        console.log('✅ Search returned results');
        console.log(`   Found: ${content.resultsCount} components`);
        content.components.forEach((c) => {
          console.log(`   - ${c.name}`);
        });
        testsPassed++;
      } else {
        console.log('❌ Search returned no results');
        testsFailed++;
      }
    } else {
      console.log('❌ Search failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error parsing search response:', error.message);
    testsFailed++;
  }

  // Test 3: List components
  console.log('\n📋 Test 3: Listing all components...');

  responseData = '';
  const listRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_components',
      arguments: { limit: 10 },
    },
  };

  server.stdin.write(JSON.stringify(listRequest) + '\n');
  await setTimeout(2000);

  try {
    const jsonMatch = responseData.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const response = JSON.parse(jsonMatch[0]);

    if (response.result && response.result.content) {
      const content = JSON.parse(response.result.content[0].text);

      if (content.components && content.total >= 3) {
        console.log('✅ List returned components');
        console.log(`   Total: ${content.total} components`);
        console.log(`   First 3:`);
        content.components.slice(0, 3).forEach((c) => {
          console.log(`   - ${c.name}: ${c.description || 'No description'}`);
        });
        testsPassed++;
      } else {
        console.log('❌ List returned insufficient components');
        testsFailed++;
      }
    } else {
      console.log('❌ List failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error parsing list response:', error.message);
    testsFailed++;
  }

  // Cleanup
  server.kill();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Milestone 2 Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}/3`);
  console.log(`   ❌ Failed: ${testsFailed}/3`);

  if (testsPassed === 3) {
    console.log('\n🎉 Milestone 2 COMPLETE! All tests passed!');
    console.log('   ✓ Can fetch specific components from GitHub');
    console.log('   ✓ Can search components by query');
    console.log('   ✓ Can list all available components');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('='.repeat(50));
}

testMilestone2().catch(console.error);
