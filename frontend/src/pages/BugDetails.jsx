import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bugAPI } from '../services/api';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  LightBulbIcon,
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function BugDetails() {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [analysisReviewed, setAnalysisReviewed] = useState(false);
  const summaryRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

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

  const handleEdit = () => {
    setEditedAnalysis({ ...bug.analysis });
    setIsEditing(true);
    setAnalysisReviewed(false);
  };

  const handleCancelEdit = () => {
    setEditedAnalysis(null);
    setIsEditing(false);
  };

  const handleSaveAnalysis = async () => {
    setSaving(true);
    try {
      await bugAPI.updateAnalysis(id, editedAnalysis);
      setBug({ ...bug, analysis: editedAnalysis });
      setIsEditing(false);
      setAnalysisReviewed(true);
      toast.success('Analysis updated successfully!');
    } catch (error) {
      toast.error('Failed to save analysis');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!window.confirm('Are you sure you want to create a JIRA ticket for this bug?')) {
      return;
    }

    setCreatingTicket(true);
    try {
      const response = await bugAPI.createJiraTicket(id);
      setBug({ ...bug, jiraTicket: response.jiraTicket });
      toast.success('JIRA ticket created successfully!');
    } catch (error) {
      toast.error('Failed to create JIRA ticket');
      console.error(error);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedAnalysis({ ...editedAnalysis, [field]: value });
  };

  const handleDownloadPDF = async () => {
    if (!bug || !bug.analysis) return;
    
    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        
        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.35) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.35 + 3;
      };

      const addSection = (title, content) => {
        addText(title, 12, true, [37, 99, 235]); // Blue color for headings
        addText(content, 10, false);
        yPosition += 3;
      };

      // Title
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-Generated Bug Analysis Report', margin, 15);
      
      yPosition = 35;

      // Summary
      addSection('Summary', bug.analysis.summary);

      // Priority and Severity
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const priorityText = `Priority: ${bug.analysis.priority}`;
      const severityText = `Severity: ${bug.analysis.severity}`;
      pdf.text(priorityText, margin, yPosition);
      pdf.text(severityText, margin + 60, yPosition);
      yPosition += 10;

      // Reproduction Steps
      addSection('Reproduction Steps', bug.analysis.reproductionSteps);

      // Root Cause Analysis
      addSection('Root Cause Analysis', bug.analysis.rootCause);

      // Suggested Fix
      addSection('Suggested Fix', bug.analysis.suggestedFix);

      // Affected Module
      addSection('Affected Module', bug.analysis.affectedModule);

      // Visual Analysis if available
      if (bug.analysis.visualAnalysis) {
        addSection('Visual Analysis from Screenshots', bug.analysis.visualAnalysis);
      }

      // Footer
      const date = new Date().toLocaleDateString();
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${date} | Bug ID: ${id}`, margin, pageHeight - 10);

      pdf.save(`bug-analysis-${id}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!summaryRef.current) return;
    
    setDownloading(true);
    try {
      const element = summaryRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bug-analysis-${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Image downloaded successfully!');
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setDownloading(false);
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
          {bug.jiraTicket && !bug.userStoryContext && (
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

          {/* Edit/Create Ticket Actions */}
          {!bug.jiraTicket && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">QA Actions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Review the AI analysis below, make edits if needed, then create a JIRA ticket
                  </p>
                </div>
                <div className="flex gap-3">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <PencilIcon className="h-5 w-5" />
                        Edit Analysis
                      </button>
                      <button
                        onClick={handleCreateTicket}
                        disabled={creatingTicket || !analysisReviewed}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <CheckIcon className="h-5 w-5" />
                        {creatingTicket ? 'Creating...' : 'Create JIRA Ticket'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
                      >
                        <XMarkIcon className="h-5 w-5" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAnalysis}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <CheckIcon className="h-5 w-5" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Section with Download Buttons */}
          <div ref={summaryRef} className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                AI-Generated Analysis Report
              </h2>
              {!isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadImage}
                    disabled={downloading}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2 text-sm"
                    title="Download as Image"
                  >
                    <PhotoIcon className="h-4 w-4" />
                    {downloading ? 'Downloading...' : 'PNG'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2 text-sm"
                    title="Download as PDF"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    {downloading ? 'Downloading...' : 'PDF'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Summary</h3>
              {isEditing ? (
                <textarea
                  value={editedAnalysis.summary}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                />
              ) : (
                <p className="text-lg text-gray-900">{bug.analysis.summary}</p>
              )}
            </div>
            
            <div className="flex gap-3 mb-6">
              <PriorityBadge priority={isEditing ? editedAnalysis.priority : bug.analysis.priority} />
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {isEditing ? editedAnalysis.severity : bug.analysis.severity}
              </span>
            </div>

            {/* Include other analysis details in the downloadable section */}
            <div className="space-y-6">
              {/* Reproduction Steps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Reproduction Steps
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedAnalysis.reproductionSteps}
                    onChange={(e) => handleFieldChange('reproductionSteps', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{bug.analysis.reproductionSteps}</p>
                )}
              </div>

              {/* Root Cause */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Root Cause Analysis
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedAnalysis.rootCause}
                    onChange={(e) => handleFieldChange('rootCause', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{bug.analysis.rootCause}</p>
                )}
              </div>

              {/* Suggested Fix */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Suggested Fix
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedAnalysis.suggestedFix}
                    onChange={(e) => handleFieldChange('suggestedFix', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{bug.analysis.suggestedFix}</p>
                )}
              </div>

              {/* Affected Module */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Affected Module</h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAnalysis.affectedModule}
                    onChange={(e) => handleFieldChange('affectedModule', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <span className="inline-block px-4 py-2 bg-primary-100 text-primary-900 rounded-lg font-semibold">
                    {bug.analysis.affectedModule}
                  </span>
                )}
              </div>

              {/* Visual Analysis if available */}
              {bug.analysis.visualAnalysis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Analysis from Screenshots</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{bug.analysis.visualAnalysis}</p>
                </div>
              )}
            </div>
          </div>

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

function EditableAnalysisSection({ icon, title, content, isEditing, onChange }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="text-primary-600 mr-2">{icon}</span>
        {title}
      </h2>
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows="6"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-sans"
        />
      ) : (
        <p className="text-gray-900 whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}
