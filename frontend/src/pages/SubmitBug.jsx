import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bugAPI, jiraAPI } from '../services/api';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  LinkIcon,
  UserIcon,
  EnvelopeIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

export default function SubmitBug() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingStory, setLoadingStory] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    logs: '',
    relatedStoryKey: '',
    submittedBy: '',
    submittedByEmail: ''
  });
  const [userStory, setUserStory] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchUserStory = async () => {
    if (!formData.relatedStoryKey.trim()) {
      toast.error('Please enter a JIRA story key');
      return;
    }

    setLoadingStory(true);
    try {
      const response = await jiraAPI.getStory(formData.relatedStoryKey);
      setUserStory(response.story);
      toast.success('User story fetched successfully!');
    } catch (error) {
      toast.error('Failed to fetch user story. Please check the key.');
      console.error(error);
    } finally {
      setLoadingStory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast.error('Please provide a bug description');
      return;
    }

    setLoading(true);
    try {
      const response = await bugAPI.submitBug(formData);
      
      toast.success('Bug submitted successfully! Analysis in progress...');
      
      // Navigate to bug details page
      setTimeout(() => {
        navigate(`/bug/${response.bugId}`);
      }, 1500);
    } catch (error) {
      toast.error('Failed to submit bug. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit a Bug Report
        </h1>
        <p className="text-gray-600">
          Provide details about the bug and let our AI create a comprehensive JIRA ticket for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bug Description */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-600" />
            Bug Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="6"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Describe what went wrong, what you expected to happen, and any other relevant details..."
            required
          />
        </div>

        {/* Logs/Error Messages */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
            <CodeBracketIcon className="h-5 w-5 mr-2 text-primary-600" />
            Logs / Error Messages (Optional)
          </label>
          <textarea
            name="logs"
            value={formData.logs}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder="Paste any relevant console logs, error messages, or stack traces..."
          />
        </div>

        {/* Related JIRA Story */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
            <LinkIcon className="h-5 w-5 mr-2 text-primary-600" />
            Related JIRA Story (Optional)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              name="relatedStoryKey"
              value={formData.relatedStoryKey}
              onChange={handleChange}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., PROJ-123"
            />
            <button
              type="button"
              onClick={fetchUserStory}
              disabled={loadingStory}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
            >
              {loadingStory ? 'Loading...' : 'Fetch Story'}
            </button>
          </div>

          {userStory && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">{userStory.summary}</h4>
              <p className="text-sm text-blue-800 mb-2">{userStory.description}</p>
              <div className="flex gap-4 text-sm text-blue-700">
                <span>Status: {userStory.status}</span>
                <span>Type: {userStory.issueType}</span>
                {userStory.assignee && <span>Assignee: {userStory.assignee}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Submitter Information */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                Name
              </label>
              <input
                type="text"
                name="submittedBy"
                value={formData.submittedBy}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                Email (for notifications)
              </label>
              <input
                type="email"
                name="submittedByEmail"
                value={formData.submittedByEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your.email@company.com"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            {loading ? 'Submitting...' : 'Submit Bug Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
