export type Severity = "critical" | "high" | "monitoring" | "resolved";

export interface SignalIssue {
    id: string;
    title: string;
    severity: Severity;
    affectedUsers: number;
    date: string;
    description: string;
    statusTimeline: {
        state: string;
        timestamp: string;
    }[];
    feedbackSummary: string[];
}

export const signalIssues: SignalIssue[] = [
    {
        id: "SIG-001",
        title: "API Latency Degradation in Core Services",
        severity: "critical",
        affectedUsers: 12450,
        date: "2026-03-08",
        description: "Significant latency observed across all routes accessing the core database, leading to timeouts in user-facing applications.",
        statusTimeline: [
            { state: "Investigating", timestamp: "Mar 08, 09:15 AM" },
            { state: "Identified", timestamp: "Mar 08, 10:00 AM" }
        ],
        feedbackSummary: [
            "Cannot log in",
            "Dashboard is frozen",
            "API keys returning 504"
        ]
    },
    {
        id: "SIG-002",
        title: "Webhook Delivery Delays",
        severity: "high",
        affectedUsers: 340,
        date: "2026-03-08",
        description: "Outgoing webhooks are delayed by up to 5 minutes due to an overloaded worker queue.",
        statusTimeline: [
            { state: "Monitoring", timestamp: "Mar 08, 08:30 AM" }
        ],
        feedbackSummary: [
            "Missing events in our system",
            "Payments webhook not arriving"
        ]
    },
    {
        id: "SIG-003",
        title: "Intermittent Database Connection Drops",
        severity: "monitoring",
        affectedUsers: 85,
        date: "2026-03-07",
        description: "Occasional connection drops to the read replica in the eu-central region.",
        statusTimeline: [
            { state: "Monitoring", timestamp: "Mar 07, 14:00 PM" }
        ],
        feedbackSummary: [
            "Brief 'connection reset' errors on reports page"
        ]
    },
    {
        id: "SIG-004",
        title: "Auth Token Rotation Failure",
        severity: "resolved",
        affectedUsers: 2100,
        date: "2026-03-06",
        description: "A bug caused token rotation to fail, logging out users unexpectedly.",
        statusTimeline: [
            { state: "Resolved", timestamp: "Mar 06, 18:00 PM" }
        ],
        feedbackSummary: [
            "Randomly signed out",
            "Mobile app won't stay logged in"
        ]
    },
    {
        id: "SIG-005",
        title: "Search Index Stale",
        severity: "monitoring",
        affectedUsers: 50,
        date: "2026-03-08",
        description: "New documents are taking over 15 minutes to appear in search results.",
        statusTimeline: [
            { state: "Investigating", timestamp: "Mar 08, 11:20 AM" }
        ],
        feedbackSummary: [
            "Can't find a user I just created"
        ]
    }
];
