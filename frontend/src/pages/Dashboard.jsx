import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bugAPI } from '../services/api';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBugs();
  }, [filter]);

  const fetchBugs = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await bugAPI.getAllBugs(params);
      setBugs(data.bugs);
    } catch (error) {
      console.error('Error fetching bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bug Dashboard</h1>
        <p className="text-gray-600">
          View and track all submitted bug reports and their analysis status.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-2 mb-6 flex gap-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All Bugs"
        />
        <FilterButton
          active={filter === 'analyzing'}
          onClick={() => setFilter('analyzing')}
          label="Analyzing"
        />
        <FilterButton
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
          label="Completed"
        />
        <FilterButton
          active={filter === 'failed'}
          onClick={() => setFilter('failed')}
          label="Failed"
        />
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : bugs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-16 text-center">
          <p className="text-gray-600 mb-4">No bugs found.</p>
          <Link
            to="/submit"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Submit Your First Bug
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bugs.map(bug => (
            <BugCard key={bug.id} bug={bug} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-md font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

function BugCard({ bug }) {
  const statusConfig = {
    analyzing: {
      icon: ArrowPathIcon,
      color: 'blue',
      text: 'Analyzing'
    },
    pending_review: {
      icon: ClockIcon,
      color: 'yellow',
      text: 'Pending QA Review'
    },
    completed: {
      icon: CheckCircleIcon,
      color: 'green',
      text: 'Completed'
    },
    failed: {
      icon: ExclamationCircleIcon,
      color: 'red',
      text: 'Failed'
    }
  };

  const config = statusConfig[bug.status] || statusConfig.analyzing;
  const StatusIcon = config.icon;

  return (
    <Link
      to={`/bug/${bug.id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {bug.analysis?.summary || bug.description.substring(0, 100) + '...'}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {new Date(bug.createdAt).toLocaleDateString()}
            </span>
            {bug.submittedBy && <span>By {bug.submittedBy}</span>}
            {bug.jiraTicket && (
              <span className="text-primary-600 font-mono">
                {bug.jiraTicket.key}
              </span>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 bg-${config.color}-100 text-${config.color}-800 rounded-full flex items-center gap-1 text-sm font-medium`}>
          <StatusIcon className="h-4 w-4" />
          {config.text}
        </span>
      </div>

      {bug.analysis && (
        <div className="flex gap-2 mt-3">
          {bug.analysis.affectedModule && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {bug.analysis.affectedModule}
            </span>
          )}
          {bug.analysis.priority && (
            <span className={`px-3 py-1 rounded-full text-sm ${getPriorityClass(bug.analysis.priority)}`}>
              {bug.analysis.priority}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function getPriorityClass(priority) {
  const classes = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-orange-100 text-orange-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800'
  };
  return classes[priority] || 'bg-gray-100 text-gray-800';
}
