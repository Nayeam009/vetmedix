export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  pet_id: string;
  user_id: string;
  content: string | null;
  media_urls: string[];
  media_type: 'image' | 'video';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  liked_by_user?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  pet_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  pet_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
}

export interface Follow {
  id: string;
  follower_user_id: string;
  follower_pet_id: string | null;
  following_pet_id: string;
  created_at: string;
}
