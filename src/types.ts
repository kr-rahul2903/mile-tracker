export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
}

export interface CarEntry {
  id: string;
  userName: string;
  mileage: number;
  endMileage?: number;
  message: string;
  tripStartDate: number;
  tripEndDate?: number;
}

export enum Tab {
  ENTRY = 'ENTRY',
  LIST = 'LIST',
  SHEET = 'SHEET'
}