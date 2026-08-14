# Day 7 — AI Client Onboarding System

## Overview

This project is an AI-powered Client Onboarding Automation System built as part of the MATalogics Day 7 internship task.

The system automates the complete initial onboarding process of a new client. A client communicates with a Vapi Voice Agent, which collects the required information and sends it to an n8n workflow.

n8n then processes the information using AI, determines the lead priority, stores the client in Airtable, creates an onboarding task in Notion, and sends an intelligent notification to the team through Slack.

## Architecture

```text
Client
   ↓
Vapi Voice Agent
   ↓
n8n Webhook
   ↓
Data Extraction & Normalization
   ↓
AI Processing
   ↓
┌─────────────────┬─────────────────┐
↓                 ↓                 ↓
Airtable         Notion            Slack
Client DB        Project Task      Team Alert
```

## Tech Stack

 Vapi — Voice AI client interaction
 n8n — Workflow automation and orchestration
 AI  LLM — Client request classification and summarization
 Airtable — Client database
 Notion — Client onboardingproject management
 Slack — Team notifications

## Vapi Voice Agent

### Agent Name

Client Onboarding Agent

The voice agent collects only the following six pieces of information

1. Client Name
2. Company Name
3. Email
4. Service Required
5. Project Description
6. Budget

The agent naturally asks the client for any missing information before completing the onboarding process.

### Example

```text
Client
Hi, I'm Ali from ABC Restaurant.
We need a website and mobile app.
Our budget is around 500,000 PKR.

Agent
Thank you, Ali. May I have your email address
```

After collecting all required information, the agent sends the data to the n8n webhook.

## n8n Workflow

The n8n workflow performs the following operations

```text
Vapi
 ↓
Webhook
 ↓
Extract Client Information
 ↓
Normalize Email
 ↓
AI Processing
 ↓
Priority Classification
 ↓
Airtable
 ↓
Notion
 ↓
Slack Notification
```

### AI Processing

The AI generates

 Service Category
 Lead Priority
 Short Summary
 Recommended Next Action

Example

```json
{
  service_category Web & Mobile Development,
  priority HIGH,
  summary Restaurant requires website and mobile ordering application.,
  next_action Schedule technical consultation
}
```

## Priority Logic

Client priority is determined according to the project budget.

 Budget                   Priority 
 -----------------------  -------- 
 `= 500,000 PKR`         HIGH     
 `200,000 – 499,999 PKR`  MEDIUM   
 ` 200,000 PKR`          LOW      

## Airtable Client Database

Airtable contains a Client Onboarding table with the following fields

```text
Client Name
Company
Email
Service
Description
Budget
Category
Priority
Summary
Status
Created At
```

Every new client automatically creates a new Airtable record.

The initial status is

```text
New
```

## Notion Onboarding

A Client Projects database is created in Notion.

For every new client, n8n automatically creates an onboarding page containing

```text
Client
Service
Budget
Priority
Summary
Next Action
Status
```

Example

```text
ABC Restaurant

Client Ali
Service Web & Mobile Development
Budget PKR 500,000
Priority HIGH

Summary
Restaurant requires website and mobile ordering application.

Next Action
Schedule technical consultation

Status
New
```

## Slack Intelligent Notifications

A notification is automatically sent to

```text
#new-clients
```

Example

```text
🚨 NEW CLIENT

Ali - ABC Restaurant

Service Web & Mobile Development
Budget PKR 500,000
Priority HIGH

AI Summary
Restaurant requires website and mobile ordering application.

Next Action
Schedule technical consultation.

Airtable + Notion records created successfully.
```

### Priority-Based Notifications

```text
HIGH
→ HIGH PRIORITY CLIENT

MEDIUM
→ MEDIUM PRIORITY CLIENT

LOW
→ STANDARD CLIENT
```

## Email Normalization

The workflow also normalizes emails received from voice input.

For example

```text
Z-A-R-A@G-M-A-I-L.dot.C-O-M
```

is normalized to

```text
zara@gmail.com
```

This ensures that clean and usable email addresses are stored in Airtable and passed to downstream systems.

## Testing

The system was tested using three different client budgets.

 Test         Budget  Expected Priority 
 ------  ----------  ----------------- 
 Test 1  600,000 PKR  HIGH              
 Test 2  300,000 PKR  MEDIUM            
 Test 3  100,000 PKR  LOW               

For each test, the complete automation flow is executed

```text
Vapi
 ↓
n8n
 ↓
AI Classification
 ↓
Airtable
 ↓
Notion
 ↓
Slack
```

## Deliverables

This repository contains

```text
├── workflow
│   └── client-onboarding-workflow.json
│
├── vapi
│   └── agent-configuration.json
│
├── screenshots
│   ├── vapi-agent.png
│   ├── n8n-workflow.png
│   ├── airtable-3-clients.png
│   ├── notion-3-pages.png
│   ├── slack-high.png
│   ├── slack-medium.png
│   └── slack-low.png
│
└── README.md
```

## Key Features

 AI-powered voice client onboarding
 Automated client data extraction
 Email normalization
 AI service classification
 Automated lead prioritization
 Airtable client database creation
 Notion onboarding task creation
 Intelligent Slack notifications
 Priority-based team alerts
 End-to-end automated workflow

## Scope

This project focuses specifically on new client onboarding and record creation.

Client update and deletion operations are not part of the Day 7 requirements.

## Outcome

The completed system eliminates manual data entry during initial client onboarding and provides the team with structured client information, an automatically generated onboarding task, and an immediate Slack notification.
