import { PresetSample } from '../types';

export const SAMPLE_PRESETS: PresetSample[] = [
  {
    id: 'sample-fake-check-job',
    type: 'text',
    title: 'Equipment Check Phishing (Fake Job)',
    badge: 'Critical Scam',
    description: 'Advance-fee fake check scam asking candidate to purchase equipment via vendor wire transfer.',
    content: `CONGRATULATIONS! OFFER OF EMPLOYMENT — SENIOR CLOUD ARCHITECT

Dear Candidate,

Following your brief screening via Signal Messenger, Apex Dynamics Global is pleased to offer you the position of Senior Cloud Architect with an initial salary of $185,000/year. This is a fully remote position.

EQUIPMENT & HOME OFFICE SETUP INSTRUCTIONS:
To prepare your workstation, our company will issue a certified cashier's check in the amount of $7,450. Upon receiving this check in your mail:
1. You must immediately deposit the check into your personal bank account.
2. Deduct your sign-on bonus of $1,000.
3. Wire transfer the remaining $6,450 via Zelle or Western Union within 24 hours to our authorized hardware fulfillment vendor (office-hardware-fulfillment@outlook.com) to dispatch your encrypted Apple MacBook Pro and dual monitor bundle.

URGENCY REQUIREMENT:
You must sign and return this offer urgently within 24 hours to guarantee your start date. Do not contact HR directly as onboarding is managed confidentially by the executive recruitment liaison.

Warm regards,
HR Recruitment Team
Apex Dynamics Global
liaison.apexglobal@gmail.com`
  },
  {
    id: 'sample-rental-deposit-trap',
    type: 'text',
    title: 'Rental Agreement Deposit Trap',
    badge: 'High Risk Scam',
    description: 'Fake landlord demanding immediate wire transfer/holding deposit before in-person viewing.',
    content: `RENTAL LEASE AGREEMENT & HOLDING CONFIRMATION

Property Address: 442 Pinehurst Terrace, Apt 4B
Monthly Rent: $1,400 (Includes utilities, parking, and high-speed fiber internet)

Dear Prospective Tenant,

Due to overwhelming demand and because I am currently on an urgent missionary assignment abroad, I cannot arrange an in-person walkthrough today. However, to secure this property and lock in this discounted rental rate:

You must send a holding deposit of $2,800 (first month's rent + security deposit) today via crypto (Bitcoin/USDT) or direct wire transfer. As soon as payment is confirmed, the keys and notarized lease documents will be shipped via FedEx overnight courier with delivery signature required.

This offer expires immediately within 12 hours if deposit is not received. Act fast as 5 other applicants are waiting.

Landlord: Marcus Vance
Contact: marcusvance.properties@yahoo.com`
  },
  {
    id: 'sample-suspicious-url',
    type: 'url',
    title: 'Typosquatted Recruiter Portal',
    badge: 'URL Anomaly',
    description: 'Phishing domain mimicking major tech careers portal using hyphenation and suspicious TLD.',
    content: `https://microso0ft-careers-portal.work/jobs/apply/security-architect?ref=tg-recruiter&track=urgently`
  },
  {
    id: 'sample-spoofed-email-header',
    type: 'header',
    title: 'Spoofed RFC 822 Email Header',
    badge: 'Header Anomaly',
    description: 'Raw email header exhibiting SPF softfail, DKIM mismatch, and Return-Path disparity.',
    content: `Delivered-To: victim.engineer@company.com
Received: by 2002:a05:6e02:18c7:b0:371:d89:e122 with SMTP id e7csp289098ilv;
        Tue, 22 Sep 2026 09:14:15 -0700 (PDT)
X-Google-Smtp-Source: AGHT+IFe8Kq9x2R9s...
Received-SPF: softfail (google.com: domain of transitioning bounce-service@malicious-relay.top does not designate 185.220.101.5 as permitted sender) client-ip=185.220.101.5;
Authentication-Results: mx.google.com;
       dkim=fail header.i=@google-careers.com header.s=202601 header.b=X9eF3;
       dmarc=fail (p=REJECT sp=REJECT dis=NONE) header.from=google.com;
Return-Path: <bounce-service@malicious-relay.top>
Received: from mail.malicious-relay.top (mail.malicious-relay.top [185.220.101.5])
        by mx.google.com with ESMTP id p12si872938plb.4
        for <victim.engineer@company.com>;
        Tue, 22 Sep 2026 09:14:14 -0700
From: "Google Talent Acquisition" <careers-notice@google.com>
Reply-To: executive.recruiter772@gmail.com
To: victim.engineer@company.com
Subject: URGENT: Job Offer Confirmation - Senior Security Engineer
Date: Tue, 22 Sep 2026 16:14:10 +0000
Message-ID: <847291847102984.fake.relay.2026@malicious-relay.top>
Content-Type: text/plain; charset="UTF-8"`
  },
  {
    id: 'sample-legit-offer',
    type: 'text',
    title: 'Legitimate Corporate Offer Letter',
    badge: 'Clean Baseline',
    description: 'Authentic job offer from an established enterprise with verified onboarding procedures.',
    content: `CONFIDENTIAL EMPLOYMENT OFFER

Date: September 22, 2026
Candidate Name: Alex Morgan

Dear Alex,

On behalf of Acme Enterprise Cloud Solutions Inc., we are delighted to offer you full-time employment as a Staff Cybersecurity Engineer reporting to the Director of Product Security.

COMPENSATION & BENEFITS:
- Base Annual Salary: $165,000 USD paid semi-monthly.
- Standard Group Health, Dental, and Vision coverage effective on day 30.
- Standard 401(k) matching up to 5%.

EQUIPMENT & ONBOARDING:
All corporate laptop and hardware equipment will be provisioned directly by Acme Corporate IT and shipped directly to your residence via tracked corporate carrier. You will never be asked to purchase equipment or transfer personal funds. Official background verification will be conducted through our certified portal via Sterling Identity.

Please review this offer and sign electronically through our secured Workday enterprise portal by September 29, 2026.

Sincerely,
Sarah Jenkins
Vice President of People Operations
Acme Enterprise Solutions Inc.
sjenkins@acme-enterprise.com`
  }
];
