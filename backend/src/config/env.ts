import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load env variables (in serverless/Vercel, env vars are injected directly — .env file is optional)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  CORS_ORIGIN: z.string().default('*'),
  GROQ_API_KEY: z.string({ required_error: 'GROQ_API_KEY is required' }),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
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
