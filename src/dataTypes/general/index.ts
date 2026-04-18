export interface AccessTokenPayload {
  sub: string;
  role: string;
  jti: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface SSOUserResponse {
  id: string | null;
  name: string | null;
  alias: string | null;
  username: string | null;
  avatar: string | null;
  about: string | null;
  role: string;
  isReviewer: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export interface GenerateTokenResponse {
  success: boolean;
  message: string;
  results: {
    accessToken: string;
    user: SSOUserResponse;
  }
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  results: {
    accessToken: string;
  }
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  results: any;
}

export interface SendInvitationInput {
  name: string;
  email: string;
}

export interface UpdateUserProfileInput {
  first_name?: string;
  last_name?: string;
  bio?: string;
}

export interface UpdatePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface GetUserDetailParams {
  withEmails?: boolean;
  withPhones?: boolean;
  withSosialMedia?: boolean;
}

interface DynamicObject {
  [key: string]: string | number | boolean | null | undefined | DynamicObject | DynamicObject[];
}

export { DynamicObject }

export interface StatFilter {
  startDate: string;
  endDate: string;
}