import { authService, type AuthUserData } from '../services/sync/auth';

export interface TelegramUserData {
  id: number;
  name: string;
  username: string | null | undefined;
  bio: string | null | undefined;
  avatar_url: string | null;
  language_code: string | null | undefined;
  bot_blocked: boolean;
}

export interface UserDataResponse {
  success: boolean;
  message: string;
  timestamp: string;
  userData: TelegramUserData | null;
  sessionToken?: string | null;
  sessionExpiresAt?: string | null;
}

const userDataFetchPromises = new Map<number, Promise<UserDataResponse>>();

export async function fetchUserData(userId?: number): Promise<UserDataResponse> {
  if (userId && userDataFetchPromises.has(userId)) {
    return userDataFetchPromises.get(userId)!;
  }

  const promise = (async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          message: 'No active session',
          timestamp: new Date().toISOString(),
          userData: null,
          sessionToken: null,
          sessionExpiresAt: null,
        };
      }

      return {
        success: true,
        message: 'Authenticated session found',
        timestamp: new Date().toISOString(),
        userData: mapAuthUserData(currentUser),
        sessionToken: null,
        sessionExpiresAt: null,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    } finally {
      if (userId) {
        userDataFetchPromises.delete(userId);
      }
    }
  })();

  if (userId) {
    userDataFetchPromises.set(userId, promise);
  }

  return promise;
}

function mapAuthUserData(user: AuthUserData): TelegramUserData {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatar_url: user.avatar_url || null,
    language_code: user.language_code,
    bot_blocked: Boolean(user.bot_blocked),
  };
}
