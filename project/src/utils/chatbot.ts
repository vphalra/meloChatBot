import OpenAI from 'openai';
import { FAQ } from '../types/chat';
import { faqs } from '../data/faqs';
import { therapists, Therapist } from '../data/therapists';
import { sanitizeInput, maskSensitiveData } from './security';
import PerformanceMonitor from './analytics';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const performanceMonitor = PerformanceMonitor.getInstance();

const BOOKING_URL = 'https://www.hellomelo.co/booking/';

// Enhanced system prompt with continuous learning
const SYSTEM_PROMPT = `You are Melody, an AI assistant for Melo, a service that connects adults with ADHD to occupational therapists.
Key information:
- Sessions cost $40 flat fee
- Working on insurance coverage
- Focus on practical, solution-focused therapy
- Help with priorities, responsibilities, and career goals
- All appointments must be booked through our website: ${BOOKING_URL}

CRITICAL DATA HANDLING RULES:
1. Never ask for or store:
   - Full medical history
   - Social security numbers
   - Complete birth dates
   - Financial information
   - Insurance details
2. Only collect minimal necessary information
3. Direct users to secure booking platform for sensitive data
4. Never share personal information between users

Your role is to:
1. Answer questions about services
2. Direct users to our booking website for scheduling appointments
3. Match users with therapists
4. Provide basic ADHD support information
5. Learn from user interactions to improve responses
6. Track conversation quality and user satisfaction

Always make clear the distinction between booking appointments and connecting to a live agent.`;

async function getStateFromInput(input: string): Promise<string | null> {
  try {
    const sanitizedInput = sanitizeInput(input);
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helper that identifies US state names or abbreviations in text. Only respond with the full state name if found, or 'null' if no state is mentioned. Example: 'I live in NY' -> 'New York'"
        },
        {
          role: "user",
          content: sanitizedInput
        }
      ],
      temperature: 0,
      max_tokens: 10
    });

    const state = completion.choices[0].message.content;
    return state === 'null' ? null : state;
  } catch (error) {
    console.error('Error detecting state:', error);
    return null;
  }
}

function getTherapistsByState(state: string): Therapist[] {
  return therapists.filter(t => 
    t.state.toLowerCase() === state.toLowerCase()
  );
}

function formatTherapistList(therapists: Therapist[]): string {
  if (therapists.length === 0) {
    return "I apologize, but we don't currently have any therapists available in your state.<br><br>" +
           "Would you like to:<br>" +
           "• Explore virtual therapy options<br>" +
           "• Join our waitlist for your area<br>" +
           "• Learn about other support services<br><br>" +
           "Or I can connect you with a live agent to discuss other options.";
  }

  let response = "Here are our available therapists:<br><br>";
  therapists.forEach(t => {
    response += `<b>${t.name}</b><br>`;
    response += `• Specialties: ${t.specialties.join(', ')}<br>`;
    response += `• Available: ${t.availability.join(', ')}<br><br>`;
  });
  
  response += `Ready to schedule? Here is the <a href="${BOOKING_URL}">link</a> to book an appointment.<br><br>`;
  response += "On our booking site, you can select your preferred therapist and choose from their available time slots.<br><br>";
  response += "Need help with the booking process or have specific questions? I can connect you with a live agent who can assist you directly in this chat.";
  
  return response;
}

export async function needsHumanSupport(userInput: string): Promise<boolean> {
  try {
    const sanitizedInput = sanitizeInput(userInput);
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You analyze if a user message needs human support. Respond only with 'true' or 'false'. Consider: complexity of question, technical issues, explicit requests for human help, signs of frustration, or need for detailed personal assistance. Note: Simple appointment booking requests should be directed to the booking website instead of human support."
        },
        {
          role: "user",
          content: sanitizedInput
        }
      ],
      temperature: 0,
      max_tokens: 5
    });

    return completion.choices[0].message.content === 'true';
  } catch (error) {
    console.error('Error checking human support:', error);
    return true; // Default to human support if there's an error
  }
}

export async function generateResponse(userInput: string): Promise<string> {
  const startTime = performance.now();
  
  try {
    const sanitizedInput = sanitizeInput(userInput);
    
    // Check for state-related queries first
    const state = await getStateFromInput(sanitizedInput);
    if (state) {
      const availableTherapists = getTherapistsByState(state);
      const response = formatTherapistList(availableTherapists);
      
      await recordMetrics(startTime, response);
      return response;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: sanitizedInput
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    let response = completion.choices[0].message.content || 
      "I apologize, but I'm having trouble generating a response. Would you like to speak with a live agent?";
    
    // Mask any accidentally included sensitive data
    response = maskSensitiveData(response);
    
    await recordMetrics(startTime, response, completion);
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return "I apologize, but I'm experiencing technical difficulties. Would you like to speak with a live agent?";
  }
}

async function recordMetrics(
  startTime: number,
  response: string,
  completion?: OpenAI.Chat.ChatCompletion
) {
  const endTime = performance.now();
  const responseTime = endTime - startTime;

  const metrics = {
    responseTime,
    tokenCount: completion?.usage?.total_tokens || 0,
    intentAccuracy: completion?.choices[0]?.finish_reason === 'stop' ? 1 : 0,
  };

  await performanceMonitor.recordMetrics(metrics);
}