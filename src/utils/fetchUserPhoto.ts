import { authService } from '../services/sync/auth';

export interface UserData {
  success: boolean;
  photo_url: string | null;
  bio: string;
  user_id: number;
  error?: string;
}

export async function fetchUserPhoto(_userId: number): Promise<UserData | null> {
  try {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    return {
      success: true,
      photo_url: currentUser.avatar_url || null,
      bio: currentUser.bio || '',
      user_id: currentUser.id,
    };
  } catch (error) {
    console.error('Error fetching user photo:', error);
    return null;
  }
}
