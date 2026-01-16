/**
 * Board Communication Service
 * Handles actual API calls between board members
 */

import axios from 'axios';

interface BoardMember {
  name: string;
  id: string;
  url: string | null;
  apiKey: string;
}

// Board member configurations
const BOARD_MEMBERS: Record<string, BoardMember> = {
  'alex-ceo': {
    name: 'Alex',
    id: '220e15ef-e801-4b31-8c74-a43193d066e3',
    url: null, // Will be fetched dynamically
    apiKey: process.env.INTERNAL_API_KEY || process.env.API_KEY || '',
  },
  'finley-cfo': {
    name: 'Finley',
    id: 'e6fcf4df-4ad8-4676-b902-f4c750c2b741',
    url: null,
    apiKey: process.env.INTERNAL_API_KEY || process.env.API_KEY || '',
  },
  'taylor-cto': {
    name: 'Taylor',
    id: 'debba13c-9275-4dbc-b7c0-7e9f5bc8839f',
    url: null,
    apiKey: process.env.INTERNAL_API_KEY || process.env.API_KEY || '',
  },
  'sam-coo': {
    name: 'Sam',
    id: '571fb404-3914-43f9-a837-4e36efd26cf9',
    url: null,
    apiKey: process.env.INTERNAL_API_KEY || process.env.API_KEY || '',
  },
  'jordan-chro': {
    name: 'Jordan',
    id: '7364bb12-256c-4036-bdfe-31562b1bf17a',
    url: null,
    apiKey: process.env.INTERNAL_API_KEY || process.env.API_KEY || '',
  },
  'jeff': {
    name: 'Jeff',
    id: 'f9d379c9-9bd3-40f8-9ff0-a33cbbd4926b',
    url: null,
    apiKey: process.env.INTERNAL_API_KEY || process.env.API_KEY || '',
  },
};

const DO_API_TOKEN = process.env.DO_API_TOKEN || '';
const DO_API_BASE = 'https://api.digitalocean.com/v2';

/**
 * Fetch board member URLs from DigitalOcean
 */
async function fetchBoardMemberUrls(): Promise<void> {
  for (const [key, member] of Object.entries(BOARD_MEMBERS)) {
    if (!member.url && member.id) {
      try {
        const response = await axios.get(`${DO_API_BASE}/apps/${member.id}`, {
          headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` },
          timeout: 5000,
        });
        const app = response.data.app;
        member.url = app.live_url || app.default_ingress || null;
      } catch (error) {
        console.error(`Failed to fetch URL for ${member.name}:`, error);
        member.url = null;
      }
    }
  }
}

/**
 * Get board member by identifier
 */
function getBoardMember(identifier: string): BoardMember | null {
  // Try exact match first
  if (BOARD_MEMBERS[identifier]) {
    return BOARD_MEMBERS[identifier];
  }
  
  // Try partial match
  const lowerId = identifier.toLowerCase();
  for (const [key, member] of Object.entries(BOARD_MEMBERS)) {
    if (key.toLowerCase().includes(lowerId) || member.name.toLowerCase() === lowerId) {
      return member;
    }
  }
  
  return null;
}

/**
 * Send message to board member via API
 */
export async function sendBoardMessage(
  to: string,
  message: string,
  type: 'question' | 'proposal' | 'decision' | 'alert' | 'update' = 'update',
  context?: Record<string, any>,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<{ success: boolean; error?: string }> {
  // Fetch URLs if not cached
  await fetchBoardMemberUrls();
  
  // Handle "all" recipients
  if (to === 'all') {
    const results = await Promise.allSettled(
      Object.values(BOARD_MEMBERS).map(member => 
        sendToMember(member, message, type, context, priority)
      )
    );
    
    const successes = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    return {
      success: successes > 0,
      error: successes < results.length ? 'Some messages failed' : undefined,
    };
  }
  
  // Find target member
  const targetMember = getBoardMember(to);
  if (!targetMember) {
    return { success: false, error: `Board member "${to}" not found` };
  }
  
  return sendToMember(targetMember, message, type, context, priority);
}

/**
 * Send message to specific member
 */
async function sendToMember(
  member: BoardMember,
  message: string,
  type: 'question' | 'proposal' | 'decision' | 'alert' | 'update',
  context?: Record<string, any>,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<{ success: boolean; error?: string }> {
  if (!member.url) {
    // Try to fetch URL
    await fetchBoardMemberUrls();
    if (!member.url) {
      return { success: false, error: `No URL available for ${member.name}` };
    }
  }
  
  try {
    const response = await axios.post(
      `${member.url}/api/board/message`,
      {
        to: member.name.toLowerCase(),
        message,
        type,
        context,
        priority,
      },
      {
        headers: {
          'x-api-key': member.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );
    
    if (response.status >= 200 && response.status < 300) {
      return { success: true };
    }
    
    return {
      success: false,
      error: `HTTP ${response.status}: ${response.data?.error || 'Unknown error'}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Get messages for current board member
 */
export async function getBoardMessages(
  memberIdentifier: string
): Promise<{ messages: any[]; error?: string }> {
  const member = getBoardMember(memberIdentifier);
  if (!member || !member.url) {
    await fetchBoardMemberUrls();
    if (!member?.url) {
      return { messages: [], error: `No URL available for ${memberIdentifier}` };
    }
  }
  
  try {
    const response = await axios.get(`${member!.url}/api/board/messages`, {
      headers: {
        'x-api-key': member!.apiKey,
      },
      timeout: 10000,
      validateStatus: () => true,
    });
    
    if (response.status >= 200 && response.status < 300) {
      return { messages: response.data.messages || [] };
    }
    
    return {
      messages: [],
      error: `HTTP ${response.status}: ${response.data?.error || 'Unknown error'}`,
    };
  } catch (error: any) {
    return {
      messages: [],
      error: error.message || 'Network error',
    };
  }
}

/**
 * Initialize board communication (fetch URLs on startup)
 */
export async function initializeBoardCommunication(): Promise<void> {
  await fetchBoardMemberUrls();
  console.log('Board communication initialized');
  Object.entries(BOARD_MEMBERS).forEach(([key, member]) => {
    if (member.url) {
      console.log(`  ${member.name}: ${member.url}`);
    } else {
      console.log(`  ${member.name}: URL not available`);
    }
  });
}

