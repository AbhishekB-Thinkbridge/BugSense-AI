import { Link } from 'react-router-dom';
import {
  BugAntIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          From Bug Report to Fix-Ready Insight — 
          <span className="text-primary-600"> Automatically</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          An AI-powered bug assistant that pulls user stories from JIRA, understands QA-reported 
          issues, and auto-creates clean bug tickets with summaries, repro steps, root cause 
          guesses, and test cases—ready for developers.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/submit"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Submit a Bug
          </Link>
          <Link
            to="/dashboard"
            className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
        <FeatureCard
          icon={<BugAntIcon className="h-12 w-12" />}
          title="JIRA Story Fetcher"
          description="Pull context from user stories, acceptance criteria, and related tasks to understand the feature under test."
        />
        <FeatureCard
          icon={<SparklesIcon className="h-12 w-12" />}
          title="AI Bug Analyzer"
          description="Convert logs, screenshots & QA description into a clean developer-ready bug ticket automatically."
        />
        <FeatureCard
          icon={<ClipboardDocumentCheckIcon className="h-12 w-12" />}
          title="Auto Ticket Creation"
          description="Draft JIRA bugs with summary, repro steps, root cause, suggested fix, and test cases."
        />
        <FeatureCard
          icon={<UserGroupIcon className="h-12 w-12" />}
          title="Smart Assignment"
          description="Auto-assign bugs to the right developer based on module identification and historical data."
        />
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-lg p-12 my-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          How It Works
        </h2>
        <div className="space-y-6">
          <Step
            number="1"
            title="QA Submits Bug"
            description="QA engineer submits a bug with description and optional screenshot/log"
          />
          <Step
            number="2"
            title="AI Analysis"
            description="AI converts it into a clear, structured bug summary with reproduction steps"
          />
          <Step
            number="3"
            title="Module Identification"
            description="System identifies the most likely affected module or feature"
          />
          <Step
            number="4"
            title="JIRA Ticket Creation"
            description="Auto-create a complete JIRA ticket with all necessary details"
          />
          <Step
            number="5"
            title="Smart Assignment"
            description="Auto-assign to the right developer based on expertise and history"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 bg-primary-600 rounded-xl text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to streamline your bug reporting?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Start using BugSense AI today and save hours on bug documentation.
        </p>
        <Link
          to="/submit"
          className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
        >
          Get Started Now
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
