# 🎯 StackZen Primary User Journey QA Script

## Overview

This script tests the most critical user journey: Onboarding → Income Entry → Budget Planning → Quote Creation → Invoice Generation → Payment Processing → Zen Insights → Mentor Booking.

## Test Environment Setup

1. Clear browser cache and cookies
2. Use incognito/private browsing window
3. Have test Stripe credentials ready
4. Prepare test data (sample income, expenses, client info)
5. Enable Zen AI and Mentor booking toggles in the settings

## Primary User Journey Test Script

### 1. Registration & Onboarding

```gherkin
Given I am a new user
When I visit the registration page
Then I should see a clean, mobile-first registration form

When I enter valid registration details
And submit the form
Then I should be redirected to the onboarding wizard

When I complete the onboarding wizard
Then I should be redirected to the dashboard
And see a welcome message
And see the Safe-to-Spend component
And the Zen AI intro prompt
```

### 2. Income Entry & Budget Planning

```gherkin
Given I am on the dashboard
When I click "Add Income"
Then I should see the income entry form

When I enter income details
And select a source
And submit the form
Then I should see the income reflected in the Safe-to-Spend amount
And see the 40/30/30 allocation rings update

When I view the budget overview
Then I should see accurate allocations
And be able to adjust allocations (if PRO user)

When I open Zen and ask “What can I safely spend?”
Then I should see a personalized response
```

### 3. Quote Creation

```gherkin
Given I am on the dashboard
When I click "Create Quote"
Then I should see the quote builder form

When I enter service details
And add line items
And set pricing
Then I should see a preview of the quote

When I generate the PDF
Then I should receive a downloadable PDF
And the quote should be saved in my quotes list
```

### 4. Invoice Generation & Payment

```gherkin
Given I have a saved quote
When I convert it to an invoice
Then I should see the invoice form with pre-filled details

When I add payment terms
And generate the invoice
Then I should see a preview of the invoice
And receive a downloadable PDF

When I send the invoice
Then the client should receive an email
And I should see the invoice status update
```

### 5. Payment Processing

```gherkin
Given I have sent an invoice
When the client clicks the payment link
Then they should see the payment form

When they enter payment details
And complete the payment
Then I should receive a payment confirmation
And see the payment reflected in my income
And receive a notification
```

### 6. Zen AI Interaction

```gherkin
Given I am on the dashboard
When I click the Zen icon
Then I should see a chat panel with tone options

When I type “Show me my income this week”
Then Zen should return grouped income and totals

When I type “Am I overspending?”
Then Zen should respond with insights based on data
```

### 7. Mentor Booking (Zen Tier)

```gherkin
Given I am a Zen Tier user
When I visit the mentor page
Then I should see a list of available mentors

When I select a mentor
And choose a session time
And confirm the session
Then I should see a booking confirmation
And receive a calendar link or reminder
```

## Performance Checkpoints

- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] PDF generation < 3 seconds
- [ ] Smooth transitions between steps
- [ ] No console errors
- [ ] No network errors
- [ ] Zen response time < 1.5 seconds
- [ ] Mentor booking completes in < 20s

## Mobile Responsiveness

- [ ] Test on iPhone (latest)
- [ ] Test on Android (latest)
- [ ] Test on tablet devices
- [ ] Verify touch interactions
- [ ] Check form inputs on mobile
- [ ] Test orientation changes (portrait/landscape)

## Error Handling

- [ ] Test network disconnection
- [ ] Test invalid form inputs
- [ ] Test payment failures
- [ ] Verify error messages are clear
- [ ] Check recovery flows
- [ ] Simulate failed mentor booking

## Notes

- Record any issues found
- Note any UX improvements needed
- Document any performance concerns
- Track any accessibility issues
- Capture console and network logs for failures

## Success Criteria

- All steps complete without errors
- All data persists correctly
- All notifications trigger
- All PDFs generate correctly
- All payments process successfully
- Zen responses are contextually accurate
- UI remains responsive throughout
