const axios = require('axios');
require('dotenv').config();

async function testJiraConnection() {
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString('base64');

  try {
    console.log('Testing JIRA connection...\n');
    console.log(`Host: ${process.env.JIRA_HOST}`);
    console.log(`Email: ${process.env.JIRA_EMAIL}`);
    console.log(`API Token: ${process.env.JIRA_API_TOKEN.substring(0, 20)}...`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 1: Get current user
    console.log('1️⃣ Testing authentication...');
    const userResponse = await axios.get(
      `https://${process.env.JIRA_HOST}/rest/api/3/myself`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );
    console.log(`✅ Authenticated as: ${userResponse.data.displayName} (${userResponse.data.emailAddress})`);
    console.log('');

    // Test 2: List all accessible projects
    console.log('2️⃣ Fetching accessible projects...');
    const projectsResponse = await axios.get(
      `https://${process.env.JIRA_HOST}/rest/api/3/project`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log(`\n📋 Found ${projectsResponse.data.length} accessible projects:\n`);
    
    if (projectsResponse.data.length === 0) {
      console.log('❌ No projects found! You need to create a JIRA project first.');
      console.log('\n👉 Create one at: https://abhibhagwat2909.atlassian.net/jira/projects');
    } else {
      projectsResponse.data.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name}`);
        console.log(`   Key: ${project.key}`);
        console.log(`   Type: ${project.projectTypeKey}`);
        console.log(`   URL: https://${process.env.JIRA_HOST}/browse/${project.key}`);
        console.log('');
      });

      // Check if ABHIB exists
      const abhibProject = projectsResponse.data.find(p => p.key === 'ABHIB');
      if (abhibProject) {
        console.log('✅ Project ABHIB found and accessible!');
      } else {
        console.log('❌ Project ABHIB not found in your accessible projects.');
        console.log(`\n💡 Use one of the project keys above in your .env file.`);
        if (projectsResponse.data.length > 0) {
          console.log(`   For example: JIRA_PROJECT_KEY=${projectsResponse.data[0].key}`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error testing JIRA connection:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
  }
}

testJiraConnection();
