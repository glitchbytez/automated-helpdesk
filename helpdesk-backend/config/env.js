import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
    PORT,
    MONGODB_URI,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_SECRET,
    JWT_COOKIE_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
    CORS_ORIGIN,
    FRONTEND_URL,
    EMAIL_SERVICE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASSWORD,
    EMAIL_FROM,
    EMAIL_FROM_NAME,
    STORAGE_TYPE,
    STORAGE_PATH,
    NODE_ENV,
    API_KEY_SECRET,
} = process.env;