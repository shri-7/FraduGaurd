import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Zap, Lock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Fraud Detection in Health Insurance
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Leveraging blockchain technology for transparent, secure, and efficient insurance claim processing with advanced fraud detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Advanced Fraud Detection
              </h3>
              <p className="text-gray-600">
                Rule-based algorithms identify suspicious patterns and anomalies in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
              <Lock className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Privacy Preserving
              </h3>
              <p className="text-gray-600">
                Sensitive data stored on IPFS with only hashes and fraud flags on-chain.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
              <Zap className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Blockchain Transparency
              </h3>
              <p className="text-gray-600">
                Immutable records ensure transparency and accountability for all transactions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
              <Users className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multi-Role System
              </h3>
              <p className="text-gray-600">
                Separate dashboards for patients, providers, and system administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Patient Registration
                </h3>
                <p className="text-gray-600 mt-2">
                  Patients register with their identity information and connect their Metamask wallet.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Claim Submission
                </h3>
                <p className="text-gray-600 mt-2">
                  Patients or providers submit insurance claims with supporting documentation.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Fraud Analysis
                </h3>
                <p className="text-gray-600 mt-2">
                  Advanced algorithms analyze the claim for fraud indicators and assign a risk score.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Blockchain Recording
                </h3>
                <p className="text-gray-600 mt-2">
                  Results are recorded on the blockchain with IPFS references for data integrity.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                  5
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Claim Resolution
                </h3>
                <p className="text-gray-600 mt-2">
                  Providers review and approve or reject claims based on fraud assessment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the future of transparent and secure health insurance processing.
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition"
          >
            Sign In Now
          </Link>
        </div>
      </section>
    </div>
  );
}
