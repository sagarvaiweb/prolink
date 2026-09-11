export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: "student" | "professional" | "recruiter" | "admin";
  isEmailVerified: boolean;
}

export interface LoginData {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: "student" | "professional" | "recruiter";
}

export interface LoginPayload {
  email: string;
  password: string;
}