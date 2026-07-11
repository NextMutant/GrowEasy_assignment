import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load env variables (in serverless/Vercel, env vars are injected directly — .env file is optional)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  CORS_ORIGIN: z.string().default('*'),
  AI_PROVIDER: z.enum(['gemini', 'groq', 'local']).default('local'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}).refine((data) => {
  if (data.AI_PROVIDER === 'gemini' && !data.GEMINI_API_KEY) {
    return false;
  }
  if (data.AI_PROVIDER === 'groq' && !data.GROQ_API_KEY) {
    return false;
  }
  return true;
}, {
  message: "Selected AI_PROVIDER requires its corresponding API key to be set",
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingKeys = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
    console.error('❌ Invalid environment configuration:\n' + missingKeys);
  } else {
    console.error('❌ Configuration error:', error);
  }
  process.exit(1);
}

export { env };
export default env;
