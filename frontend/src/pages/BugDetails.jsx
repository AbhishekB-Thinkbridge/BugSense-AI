import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bugAPI } from '../services/api';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  LightBulbIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function BugDetails() {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchBug();
    
    // Poll for updates every 3 seconds if still analyzing
    const interval = setInterval(() => {
      if (polling) {
        fetchBug();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, polling]);

  const fetchBug = async () => {
    try {
      const data = await bugAPI.getBug(id);
      setBug(data);
      
      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        setPolling(false);
      }
    } catch (error) {
      console.error('Error fetching bug:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="text-center py-16">
        <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bug Not Found</h2>
        <Link to="/dashboard" className="text-primary-600 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Bug Report Details</h1>
          <StatusBadge status={bug.status} />
        </div>
        <p className="text-gray-600">
          Submitted {new Date(bug.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Status Messages */}
      {bug.status === 'analyzing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 flex items-center">
          <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900">Analysis in Progress</h3>
            <p className="text-blue-800">
              Our AI is analyzing your bug report and creating a JIRA ticket. This usually takes 30-60 seconds.
            </p>
          </div>
        </div>
      )}

      {bug.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">Analysis Failed</h3>
          <p className="text-red-800">{bug.error || 'An error occurred during analysis'}</p>
        </div>
      )}

      {/* Original Submission */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Original Submission</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{bug.description}</p>
          </div>

          {bug.logs && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Logs/Error Messages</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {bug.logs}
              </pre>
            </div>
          )}

          {bug.submittedBy && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="h-4 w-4" />
              Submitted by: {bug.submittedBy}
            </div>
          )}

          {/* Screenshots */}
          {bug.screenshotUrls && bug.screenshotUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bug Screenshots</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bug.screenshotUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-500 transition-colors cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Click to enlarge
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Log Images */}
          {bug.logImageUrls && bug.logImageUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Log Screenshots</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bug.logImageUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                  >
                    <img
                      src={url}
                      alt={`Log Screenshot ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-500 transition-colors cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Click to enlarge
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Story Context */}
      {bug.userStoryContext && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related User Story</h2>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-primary-600">{bug.userStoryContext.key}</span>
              <span className="mx-2">—</span>
              <span className="text-gray-900">{bug.userStoryContext.summary}</span>
            </div>
            {bug.userStoryContext.description && (
              <p className="text-gray-700">{bug.userStoryContext.description}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Status: {bug.userStoryContext.status}</span>
              {bug.userStoryContext.components?.length > 0 && (
                <span>Components: {bug.userStoryContext.components.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {bug.status === 'completed' && bug.analysis && (
        <>
          {/* JIRA Ticket */}
          {bug.jiraTicket && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2" />
                JIRA Ticket Created
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Ticket: </span>
                  <a
                    href={bug.jiraTicket.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline font-mono"
                  >
                    {bug.jiraTicket.key}
                  </a>
                </div>
                {bug.suggestedAssignee && (
                  <div>
                    <span className="font-semibold">Assigned to: </span>
                    <span className="text-gray-900">{bug.suggestedAssignee}</span>
                  </div>
                )}
                <a
                  href={bug.jiraTicket.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View in JIRA
                </a>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              AI-Generated Summary
            </h2>
            <p className="text-lg text-gray-900">{bug.analysis.summary}</p>
            <div className="flex gap-3 mt-4">
              <PriorityBadge priority={bug.analysis.priority} />
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {bug.analysis.severity}
              </span>
            </div>
          </div>

          {/* Reproduction Steps */}
          <AnalysisSection
            icon={<DocumentDuplicateIcon className="h-6 w-6" />}
            title="Reproduction Steps"
            content={bug.analysis.reproductionSteps}
          />

          {/* Root Cause */}
          <AnalysisSection
            icon={<ExclamationCircleIcon className="h-6 w-6" />}
            title="Root Cause Analysis"
            content={bug.analysis.rootCause}
          />

          {/* Visual Analysis - if images were provided */}
          {bug.analysis.visualAnalysis && (
            <AnalysisSection
              icon={<ExclamationCircleIcon className="h-6 w-6" />}
              title="Visual Analysis from Screenshots"
              content={bug.analysis.visualAnalysis}
            />
          )}

          {/* Suggested Fix */}
          <AnalysisSection
            icon={<LightBulbIcon className="h-6 w-6" />}
            title="Suggested Fix"
            content={bug.analysis.suggestedFix}
          />

          {/* Affected Module */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Affected Module</h2>
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-900 rounded-lg font-semibold">
              {bug.analysis.affectedModule}
            </span>
          </div>

          {/* Test Cases */}
          {bug.testCases && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BeakerIcon className="h-6 w-6 mr-2 text-primary-600" />
                Generated Test Cases
              </h2>
              <pre className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm">
                {bug.testCases}
              </pre>
            </div>
          )}

          {/* Potential Assignees */}
          {bug.potentialAssignees && bug.potentialAssignees.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Potential Assignees
              </h2>
              <div className="space-y-2">
                {bug.potentialAssignees.map((assignee, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{assignee.name}</span>
                    <span className="text-sm text-gray-600">
                      {assignee.count} recent tickets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    analyzing: { color: 'blue', icon: ArrowPathIcon, text: 'Analyzing' },
    completed: { color: 'green', icon: CheckCircleIcon, text: 'Completed' },
    failed: { color: 'red', icon: ExclamationCircleIcon, text: 'Failed' }
  };

  const { color, icon: Icon, text } = config[status] || config.analyzing;

  return (
    <span className={`px-4 py-2 bg-${color}-100 text-${color}-800 rounded-full flex items-center gap-2`}>
      <Icon className="h-5 w-5" />
      {text}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    Critical: 'red',
    High: 'orange',
    Medium: 'yellow',
    Low: 'green'
  };

  const color = colors[priority] || 'gray';

  return (
    <span className={`px-3 py-1 bg-${color}-100 text-${color}-800 rounded-full text-sm font-medium`}>
      {priority} Priority
    </span>
  );
}

function AnalysisSection({ icon, title, content }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="text-primary-600 mr-2">{icon}</span>
        {title}
      </h2>
      <p className="text-gray-900 whitespace-pre-wrap">{content}</p>
    </div>
  );
}
