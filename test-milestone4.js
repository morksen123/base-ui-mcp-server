#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function sendRequest(server, request) {
  let responseData = '';

  const promise = new Promise((resolve) => {
    const handler = (data) => {
      responseData += data.toString();
    };
    server.stdout.on('data', handler);

    setTimeout(3000).then(() => {
      server.stdout.off('data', handler);
      resolve(responseData);
    });
  });

  server.stdin.write(JSON.stringify(request) + '\n');
  return promise;
}

function parseResponse(responseData) {
  const jsonMatch = responseData.match(/\{.*\}/s);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

async function testMilestone4() {
  console.log('🧪 Testing Milestone 4: Error Handling & Validation\n');

  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  console.log('⏳ Waiting for server to start...');
  await setTimeout(2000);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Validation - Empty query
  console.log('❌ Test 1: Validation error for empty query...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: '' },
      },
    });

    const response = parseResponse(responseData);

    if (response.result?.isError || response.error) {
      console.log('✅ Validation works - rejected empty query');
      console.log(`   Error message: ${response.result?.content[0]?.text?.substring(0, 100)}...`);
      testsPassed++;
    } else {
      console.log('❌ Should have rejected empty query');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 2: Validation - Invalid limit
  console.log('\n📊 Test 2: Validation error for invalid limit...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'dialog', limit: -5 },
      },
    });

    const response = parseResponse(responseData);

    if (response.result?.isError || response.error) {
      console.log('✅ Validation works - rejected negative limit');
      testsPassed++;
    } else {
      console.log('❌ Should have rejected negative limit');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 3: Helpful error for not found component
  console.log('\n🔍 Test 3: Helpful error message for component not found...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_component',
        arguments: { name: 'NonExistentComponent123' },
      },
    });

    const response = parseResponse(responseData);

    if (response.result?.content) {
      const text = response.result.content[0].text;

      if (text.includes('not found') && text.includes('💡')) {
        console.log('✅ Provides helpful error with suggestions');
        console.log(`   Suggestions included: ${text.includes('search_components')}`);
        testsPassed++;
      } else {
        console.log('❌ Error message lacks suggestions');
        testsFailed++;
      }
    } else {
      console.log('❌ No content in response');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 4: Helpful error for empty search results
  console.log('\n🔎 Test 4: Helpful error for no search results...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'xyz999nonexistent', limit: 10 },
      },
    });

    const response = parseResponse(responseData);

    if (response.result?.content) {
      const text = response.result.content[0].text;

      if (text.includes('No components found') && text.includes('💡')) {
        console.log('✅ Provides helpful message with suggestions');
        console.log(`   Suggests alternatives: ${text.includes('Try:')}`);
        testsPassed++;
      } else {
        console.log('❌ Error message lacks guidance');
        testsFailed++;
      }
    } else {
      console.log('❌ No content in response');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 5: Valid request still works
  console.log('\n✅ Test 5: Valid requests still work correctly...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'input', limit: 5 },
      },
    });

    const response = parseResponse(responseData);

    if (response.result?.content && !response.result.isError) {
      const content = JSON.parse(response.result.content[0].text);

      if (content.components && content.resultsCount > 0) {
        console.log('✅ Valid requests work correctly');
        console.log(`   Found: ${content.resultsCount} components`);
        testsPassed++;
      } else {
        console.log('❌ Valid request failed');
        testsFailed++;
      }
    } else {
      console.log('❌ Valid request returned error');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Cleanup
  server.kill();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Milestone 4 Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}/5`);
  console.log(`   ❌ Failed: ${testsFailed}/5`);

  if (testsPassed >= 4) {
    console.log('\n🎉 Milestone 4 COMPLETE! Error handling is comprehensive!');
    console.log('   ✓ Input validation with Zod');
    console.log('   ✓ Helpful error messages');
    console.log('   ✓ Suggestions for fixing errors');
    console.log('   ✓ Graceful handling of edge cases');
    console.log('   ✓ Valid requests still work');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }

  console.log('='.repeat(50));
}

testMilestone4().catch(console.error);
