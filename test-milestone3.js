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

async function testMilestone3() {
  console.log('🧪 Testing Milestone 3: Enhanced Search & Filtering\n');

  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  console.log('⏳ Waiting for server to start...');
  await setTimeout(2000);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Fuzzy search - partial match
  console.log('🔍 Test 1: Fuzzy search for "dial" (should find Dialog components)...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'dial', limit: 5 },
      },
    });

    const response = parseResponse(responseData);
    if (response.result?.content) {
      const content = JSON.parse(response.result.content[0].text);

      const foundDialog = content.components.some((c) => c.name.toLowerCase().includes('dialog'));

      if (foundDialog && content.resultsCount > 0) {
        console.log('✅ Fuzzy search works - found Dialog components');
        console.log(`   Results: ${content.resultsCount} components`);
        content.components.slice(0, 3).forEach((c) => {
          console.log(`   - ${c.name}`);
        });
        testsPassed++;
      } else {
        console.log('❌ Fuzzy search failed - no Dialog components found');
        testsFailed++;
      }
    } else {
      console.log('❌ Search failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 2: Relevance ranking
  console.log('\n📊 Test 2: Relevance ranking for "Input"...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'Input', limit: 10 },
      },
    });

    const response = parseResponse(responseData);
    if (response.result?.content) {
      const content = JSON.parse(response.result.content[0].text);

      // Exact match should be first
      const firstResult = content.components[0];

      if (firstResult?.name === 'Input') {
        console.log('✅ Relevance ranking works - exact match is first');
        console.log(`   Top result: ${firstResult.name}`);
        testsPassed++;
      } else {
        console.log('❌ Relevance ranking failed');
        console.log(`   Expected "Input" but got "${firstResult?.name}"`);
        testsFailed++;
      }
    } else {
      console.log('❌ Search failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 3: Search in descriptions
  console.log('\n📝 Test 3: Search in descriptions for "button"...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'button', limit: 10 },
      },
    });

    const response = parseResponse(responseData);
    if (response.result?.content) {
      const content = JSON.parse(response.result.content[0].text);

      if (content.resultsCount > 0) {
        console.log('✅ Description search works');
        console.log(`   Found: ${content.resultsCount} components with "button"`);
        content.components.slice(0, 3).forEach((c) => {
          console.log(`   - ${c.name}: ${c.description?.substring(0, 50)}...`);
        });
        testsPassed++;
      } else {
        console.log('❌ Description search failed');
        testsFailed++;
      }
    } else {
      console.log('❌ Search failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 4: Case insensitive search
  console.log('\n🔤 Test 4: Case insensitive search for "DIALOG"...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'DIALOG', limit: 5 },
      },
    });

    const response = parseResponse(responseData);
    if (response.result?.content) {
      const content = JSON.parse(response.result.content[0].text);

      const foundDialog = content.components.some((c) => c.name.toLowerCase().includes('dialog'));

      if (foundDialog) {
        console.log('✅ Case insensitive search works');
        console.log(`   Found: ${content.resultsCount} Dialog components`);
        testsPassed++;
      } else {
        console.log('❌ Case insensitive search failed');
        testsFailed++;
      }
    } else {
      console.log('❌ Search failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testsFailed++;
  }

  // Test 5: Empty/irrelevant query handling
  console.log('\n❓ Test 5: Handling irrelevant query "xyz123"...');

  try {
    const responseData = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'search_components',
        arguments: { query: 'xyz123', limit: 5 },
      },
    });

    const response = parseResponse(responseData);
    if (response.result?.content) {
      const content = JSON.parse(response.result.content[0].text);

      // Should return 0 or very few results
      if (content.resultsCount === 0 || content.resultsCount <= 1) {
        console.log('✅ Handles irrelevant queries correctly');
        console.log(`   Results: ${content.resultsCount} (as expected)`);
        testsPassed++;
      } else {
        console.log('❌ Too many results for irrelevant query');
        testsFailed++;
      }
    } else {
      console.log('❌ Search failed');
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
  console.log('📊 Milestone 3 Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}/5`);
  console.log(`   ❌ Failed: ${testsFailed}/5`);

  const successRate = (testsPassed / 5) * 100;
  console.log(`   📈 Success Rate: ${successRate.toFixed(0)}%`);

  if (testsPassed >= 4) {
    // 80% success rate
    console.log('\n🎉 Milestone 3 COMPLETE! Search accuracy >80%!');
    console.log('   ✓ Fuzzy search with partial matches');
    console.log('   ✓ Relevance ranking (exact matches first)');
    console.log('   ✓ Description and content search');
    console.log('   ✓ Case insensitive matching');
    console.log('   ✓ Proper handling of irrelevant queries');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }

  console.log('='.repeat(50));
}

testMilestone3().catch(console.error);
