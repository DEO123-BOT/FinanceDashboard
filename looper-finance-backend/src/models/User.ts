export interface IUser {
  user_id: string;
  password: string; // plaintext for demo; bcrypt in real apps
}

export const users: IUser[] = [
  { user_id: 'user_001', password: 'password1' },
  { user_id: 'user_002', password: 'password2' },
  { user_id: 'user_003', password: 'password3' },
  { user_id: 'user_004', password: 'password4' },
];
