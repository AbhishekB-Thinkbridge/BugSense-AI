const JiraClient = require('jira-client');

const jira = new JiraClient({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_EMAIL,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

class JiraService {
  /**
   * Fetch a user story from JIRA
   * @param {string} issueKey - JIRA issue key (e.g., PROJ-123)
   */
  async fetchUserStory(issueKey) {
    try {
      const issue = await jira.findIssue(issueKey);
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        acceptanceCriteria: issue.fields.customfield_10000 || '', // Adjust field ID
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        project: issue.fields.project.key,
        issueType: issue.fields.issuetype.name,
        labels: issue.fields.labels,
        components: issue.fields.components?.map(c => c.name) || [],
        priority: issue.fields.priority?.name
      };
    } catch (error) {
      console.error('Error fetching JIRA story:', error);
      throw new Error(`Failed to fetch JIRA story: ${error.message}`);
    }
  }

  /**
   * Create a bug ticket in JIRA
   * @param {Object} bugData - Bug information
   */
  async createBugTicket(bugData) {
    try {
      const {
        summary,
        description,
        reproductionSteps,
        rootCause,
        suggestedFix,
        affectedModule,
        relatedStory,
        priority = 'Medium',
        assignee = null
      } = bugData;

      // Format the description with all sections
      const formattedDescription = `
*Bug Description:*
${description}

*Reproduction Steps:*
${reproductionSteps}

*Root Cause Analysis:*
${rootCause}

*Suggested Fix:*
${suggestedFix}


*Affected Module:*
${affectedModule}

${relatedStory ? `*Related Story:* ${relatedStory}` : ''}
      `.trim();

      const newIssue = {
        fields: {
          project: {
            key: process.env.JIRA_PROJECT_KEY
          },
          summary: summary,
          description: formattedDescription,
          issuetype: {
            name: 'Bug'
          },
          priority: {
            name: priority
          },
          labels: ['ai-generated', 'bugsense']
        }
      };

      // Add assignee if provided
      if (assignee) {
        newIssue.fields.assignee = { name: assignee };
      }

      // Add related story link if provided
      if (relatedStory) {
        newIssue.fields.customfield_10001 = relatedStory; // Adjust field ID
      }

      const createdIssue = await jira.addNewIssue(newIssue);
      
      return {
        key: createdIssue.key,
        id: createdIssue.id,
        url: `https://${process.env.JIRA_HOST}/browse/${createdIssue.key}`
      };
    } catch (error) {
      console.error('Error creating JIRA bug:', error);
      throw new Error(`Failed to create JIRA bug: ${error.message}`);
    }
  }

  /**
   * Get potential assignees based on component or module
   * @param {string} component - Component or module name
   */
  async getPotentialAssignees(component) {
    try {
      // Search for recent issues in the same component
      const jql = `project = ${process.env.JIRA_PROJECT_KEY} AND component = "${component}" AND status in (Resolved, Closed) ORDER BY updated DESC`;
      
      const searchResults = await jira.searchJira(jql, {
        maxResults: 10,
        fields: ['assignee']
      });

      // Count assignees
      const assigneeCounts = {};
      searchResults.issues.forEach(issue => {
        const assignee = issue.fields.assignee?.name;
        if (assignee) {
          assigneeCounts[assignee] = (assigneeCounts[assignee] || 0) + 1;
        }
      });

      // Sort by frequency
      const sortedAssignees = Object.entries(assigneeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      return sortedAssignees;
    } catch (error) {
      console.error('Error getting potential assignees:', error);
      return [];
    }
  }

  /**
   * Search for similar bugs
   * @param {string} summary - Bug summary
   */
  async searchSimilarBugs(summary) {
    try {
      const jql = `project = ${process.env.JIRA_PROJECT_KEY} AND issuetype = Bug AND text ~ "${summary}" ORDER BY created DESC`;
      
      const searchResults = await jira.searchJira(jql, {
        maxResults: 5,
        fields: ['summary', 'status', 'assignee', 'resolution']
      });

      return searchResults.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        resolution: issue.fields.resolution?.name
      }));
    } catch (error) {
      console.error('Error searching similar bugs:', error);
      return [];
    }
  }
}

module.exports = new JiraService();
