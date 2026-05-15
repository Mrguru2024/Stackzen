#!/bin/bash

# StackZen Beta Testing Runner
echo "🚀 Starting StackZen Beta Testing Suite"

# Run all test suites
echo "🧪 Running Authentication Tests..."
npm run test -- --testPathPattern=auth

echo "💰 Running Income & Expense Tests..."
npm run test -- --testPathPattern=income|expense

echo "📄 Running Quote & Invoice Tests..."
npm run test -- --testPathPattern=quote|invoice

echo "🤖 Running AI Companion Tests..."
npm run test -- --testPathPattern=ai|zen

echo "📅 Running Calendar Tests..."
npm run test -- --testPathPattern=calendar

echo "📬 Running Notification Tests..."
npm run test -- --testPathPattern=notification

echo "🛡️ Running Admin & Security Tests..."
npm run test -- --testPathPattern=admin|security

# Run performance tests
echo "⚡ Running Performance Tests..."
npm run test -- --testPathPattern=performance

# Run E2E tests
echo "🔍 Running E2E Tests..."
npm run test:e2e

# Generate coverage report
echo "📊 Generating Coverage Report..."
npm run test -- --coverage

echo "✅ Testing Complete! Check the coverage report for details." 