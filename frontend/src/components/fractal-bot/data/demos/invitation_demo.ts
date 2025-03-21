import { v4 as uuidv4 } from 'uuid';
import { DemoScript, DemoState } from '../fractal_bot_data';
import { Phase } from '../../types/state';

// Define constant IDs for assets
const ASSET_IDS = {
    INVITATION_DRAFT: 'birthday-invitation-draft',
    CONTACT_LIST_1: 'contact-list-1',
    CONTACT_LIST_2: 'contact-list-2',
    MERGED_CONTACTS: 'merged-contact-list',
    FINAL_INVITATIONS: 'final-invitations'
} as const;

// Define constant IDs for agents
const AGENT_IDS = {
    MERGE_AGENT: 'contact-merge-agent',
    DOCUMENT_MERGE_AGENT: 'document-merge-agent'
} as const;

// Create the demo states array
const demoStates: DemoState[] = [
    {
        stage: 'initial',
        description: 'Initial greeting from FractalBot',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Hello! I\'m FractalBot. What question can I help you with today?',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'request_received',
        description: 'User requests a birthday party invitation draft',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'I need a draft for a birthday party invitation. It\'s for my daughter\'s 10th birthday party at the local park. The party will be from 2-5 PM on Saturday, and we\'ll have games, cake, and a piñata.',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'draft_creation_started',
        description: 'FractalBot starts creating the invitation draft',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ll create a draft birthday party invitation for you. Let me work on that...',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.INVITATION_DRAFT,
            type: 'document',
            name: 'Birthday Party Invitation Draft',
            content: 'Creating invitation draft...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['invitation', 'birthday', 'draft']
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'draft_creation_completed',
        description: 'FractalBot completes the invitation draft',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ve created a draft of the birthday party invitation. You can find it in your assets. Would you like me to make any adjustments to the invitation?',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.INVITATION_DRAFT,
            updates: {
                ready: true,
                content: `🎉 You're Invited! 🎉

Join us for a special celebration!

What: Sarah's 10th Birthday Party
When: Saturday, [Date]
Time: 2:00 PM - 5:00 PM
Where: Local Park
[Park Address]

We'll have:
🎮 Fun Games
🎂 Birthday Cake
🎪 Piñata
🎈 Balloons
🎨 Crafts

Please RSVP by [RSVP Date]
Contact: [Your Phone/Email]

We can't wait to celebrate with you!
[Your Name]`
            }
        }]
    },
    {
        stage: 'contact_lists_uploaded',
        description: 'User uploads contact lists for merging',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'I\'ve uploaded two contact lists that I need merged. One is from my phone contacts and another from my email. Can you help me merge them and remove any duplicates?',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [
            {
                id: ASSET_IDS.CONTACT_LIST_1,
                type: 'data',
                name: 'Phone Contacts',
                content: [
                    { name: 'John Smith', phone: '555-0101', email: 'john@email.com' },
                    { name: 'Sarah Johnson', phone: '555-0102', email: 'sarah@email.com' },
                    { name: 'Mike Wilson', phone: '555-0103', email: 'mike@email.com' }
                ],
                ready: true,
                metadata: {
                    timestamp: new Date().toISOString(),
                    tags: ['contacts', 'phone']
                }
            },
            {
                id: ASSET_IDS.CONTACT_LIST_2,
                type: 'data',
                name: 'Email Contacts',
                content: [
                    { name: 'John Smith', phone: '555-0101', email: 'john@email.com' },
                    { name: 'Emily Brown', phone: '555-0104', email: 'emily@email.com' },
                    { name: 'David Lee', phone: '555-0105', email: 'david@email.com' }
                ],
                ready: true,
                metadata: {
                    timestamp: new Date().toISOString(),
                    tags: ['contacts', 'email']
                }
            }
        ],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'merge_started',
        description: 'FractalBot starts merging contact lists',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ll help you merge these contact lists and remove duplicates. Let me create a Merge Agent to handle this task.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.MERGE_AGENT,
                    title: 'Contact Merge Agent',
                    description: 'Merging and deduplicating contact lists',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.MERGED_CONTACTS,
            type: 'data',
            name: 'Merged Contact List',
            content: 'Merging contacts...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['contacts', 'merged'],
                agentId: AGENT_IDS.MERGE_AGENT
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'merge_completed',
        description: 'Contact list merge completed',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ve merged your contact lists and removed duplicates. The merged list is now available in your assets. I found 5 unique contacts after removing 1 duplicate entry.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.MERGE_AGENT,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.MERGED_CONTACTS,
            updates: {
                ready: true,
                content: [
                    { name: 'John Smith', phone: '555-0101', email: 'john@email.com' },
                    { name: 'Sarah Johnson', phone: '555-0102', email: 'sarah@email.com' },
                    { name: 'Mike Wilson', phone: '555-0103', email: 'mike@email.com' },
                    { name: 'Emily Brown', phone: '555-0104', email: 'emily@email.com' },
                    { name: 'David Lee', phone: '555-0105', email: 'david@email.com' }
                ]
            }
        }]
    },
    {
        stage: 'merge_requested',
        description: 'User requests to merge invitation with contact list',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'Now that we have the invitation and the contact list, could you create a single document that combines them? I want to be able to print and mail the invitations.',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'document_merge_started',
        description: 'Starting document merge process',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ll help you create personalized invitations for each contact. I\'ll launch the Document Merge Agent to combine the invitation template with the contact list.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.DOCUMENT_MERGE_AGENT,
                    title: 'Document Merge Agent',
                    description: 'Creating personalized invitations for each contact',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.FINAL_INVITATIONS,
            type: 'document',
            name: 'Personalized Birthday Invitations',
            content: 'Generating personalized invitations...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['invitations', 'personalized', 'merged'],
                agentId: AGENT_IDS.DOCUMENT_MERGE_AGENT
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'document_merge_completed',
        description: 'Document merge completed',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ve created personalized invitations for each contact. The invitations are now ready to be printed and mailed. Each invitation has been customized with the recipient\'s name and includes all the party details. You can find the complete set in your assets.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.DOCUMENT_MERGE_AGENT,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.FINAL_INVITATIONS,
            updates: {
                ready: true,
                content: [
                    {
                        recipient: 'John Smith',
                        invitation: `🎉 You're Invited! 🎉

Dear John,

Join us for a special celebration!

What: Sarah's 10th Birthday Party
When: Saturday, [Date]
Time: 2:00 PM - 5:00 PM
Where: Local Park
[Park Address]

We'll have:
🎮 Fun Games
🎂 Birthday Cake
🎪 Piñata
🎈 Balloons
🎨 Crafts

Please RSVP by [RSVP Date]
Contact: [Your Phone/Email]

We can't wait to celebrate with you!
[Your Name]`
                    },
                    {
                        recipient: 'Sarah Johnson',
                        invitation: `🎉 You're Invited! 🎉

Dear Sarah,

Join us for a special celebration!

What: Sarah's 10th Birthday Party
When: Saturday, [Date]
Time: 2:00 PM - 5:00 PM
Where: Local Park
[Park Address]

We'll have:
🎮 Fun Games
🎂 Birthday Cake
🎪 Piñata
🎈 Balloons
🎨 Crafts

Please RSVP by [RSVP Date]
Contact: [Your Phone/Email]

We can't wait to celebrate with you!
[Your Name]`
                    },
                    {
                        recipient: 'Mike Wilson',
                        invitation: `🎉 You're Invited! 🎉

Dear Mike,

Join us for a special celebration!

What: Sarah's 10th Birthday Party
When: Saturday, [Date]
Time: 2:00 PM - 5:00 PM
Where: Local Park
[Park Address]

We'll have:
🎮 Fun Games
🎂 Birthday Cake
🎪 Piñata
🎈 Balloons
🎨 Crafts

Please RSVP by [RSVP Date]
Contact: [Your Phone/Email]

We can't wait to celebrate with you!
[Your Name]`
                    },
                    {
                        recipient: 'Emily Brown',
                        invitation: `🎉 You're Invited! 🎉

Dear Emily,

Join us for a special celebration!

What: Sarah's 10th Birthday Party
When: Saturday, [Date]
Time: 2:00 PM - 5:00 PM
Where: Local Park
[Park Address]

We'll have:
🎮 Fun Games
🎂 Birthday Cake
🎪 Piñata
🎈 Balloons
🎨 Crafts

Please RSVP by [RSVP Date]
Contact: [Your Phone/Email]

We can't wait to celebrate with you!
[Your Name]`
                    },
                    {
                        recipient: 'David Lee',
                        invitation: `🎉 You're Invited! 🎉

Dear David,

Join us for a special celebration!

What: Sarah's 10th Birthday Party
When: Saturday, [Date]
Time: 2:00 PM - 5:00 PM
Where: Local Park
[Park Address]

We'll have:
🎮 Fun Games
🎂 Birthday Cake
🎪 Piñata
🎈 Balloons
🎨 Crafts

Please RSVP by [RSVP Date]
Contact: [Your Phone/Email]

We can't wait to celebrate with you!
[Your Name]`
                    }
                ]
            }
        }]
    }
];

// Create and export the invitation demo script
export const invitationDemoScript: DemoScript = {
    id: 'invitation-creator',
    name: 'Invitation Creator',
    description: 'Create and customize party invitations with FractalBot',
    states: demoStates
}; 