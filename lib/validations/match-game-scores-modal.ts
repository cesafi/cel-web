import { z } from 'zod';

// Duration validation - allows flexible input but enforces HH:MM:SS format
export const durationSchema = z
  .string()
  .min(1, { message: 'Duration is required.' })
  .refine(
    (value) => {
      // Allow empty string for clearing
      if (value === '') return true;

      // Check if it's already in HH:MM:SS format
      if (/^([0-9]|[0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/.test(value)) {
        return true;
      }

      // Try to parse natural language formats
      const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
      if (match) {
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');

        // Validate ranges
        return hours <= 23 && minutes <= 59 && seconds <= 59;
      }

      return false;
    },
    {
      message:
        'Duration must be in HH:MM:SS format (e.g., 01:30:45) or natural format (e.g., 1h 30m).'
    }
  );

// Score validation for individual participants
export const scoreSchema = z
  .string()
  .min(1, { message: 'Score is required.' })
  .refine(
    (value) => {
      const numValue = parseInt(value);
      return !isNaN(numValue) && numValue >= 0;
    },
    {
      message: 'Score must be a non-negative number.'
    }
  );

// Game timing update validation
export const gameTimingUpdateSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: durationSchema.optional()
});

// Score submission validation
export const scoreSubmissionSchema = z.object({
  scores: z.record(z.number(), scoreSchema),
  gameId: z.number({ message: 'Game ID is required.' })
});

// Complete modal validation
export const matchGameScoresModalSchema = z.object({
  gameStatus: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: durationSchema.optional(),
  scores: z.record(z.number(), scoreSchema),
  gameId: z.number({ message: 'Game ID is required.' })
});

// Utility function to format duration to HH:MM:SS
export const formatDurationToHHMMSS = (duration: string): string => {
  if (!duration) return '00:00:00';

  // If already in HH:MM:SS format, return as is
  if (/^([0-9]|[0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/.test(duration)) {
    return duration;
  }

  // Try to parse common formats and convert to HH:MM:SS
  const match = duration.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return '00:00:00'; // Default fallback
};

// Utility function to validate and format duration input
export const validateAndFormatDuration = (
  input: string
): { isValid: boolean; formatted: string; error?: string } => {
  try {
    const result = durationSchema.parse(input);
    const formatted = formatDurationToHHMMSS(result);
    return { isValid: true, formatted };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        formatted: '00:00:00',
        error: 'Invalid duration format'
      };
    }
    return {
      isValid: false,
      formatted: '00:00:00',
      error: 'Unknown validation error'
    };
  }
};
