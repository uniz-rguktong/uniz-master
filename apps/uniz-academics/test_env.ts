import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

console.log('--- Academics Env Debug ---');
console.log('JWT_SECURITY_KEY:', process.env.JWT_SECURITY_KEY);
console.log('INTERNAL_SECRET:', process.env.INTERNAL_SECRET);
console.log('AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('--- End ---');
