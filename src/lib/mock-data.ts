export interface Player {
  id: string;
  full_name: string;
  avatar_url: string;
  goals: number;
  assists: number;
  clean_sheets: number;
}

export const mockPlayers: Player[] = [
  { id: "1", full_name: "Marcus Johnson", avatar_url: "", goals: 14, assists: 7, clean_sheets: 2 },
  { id: "2", full_name: "David Okafor", avatar_url: "", goals: 11, assists: 4, clean_sheets: 0 },
  { id: "3", full_name: "James Rodriguez", avatar_url: "", goals: 9, assists: 11, clean_sheets: 1 },
  { id: "4", full_name: "Ali Hassan", avatar_url: "", goals: 8, assists: 3, clean_sheets: 5 },
  { id: "5", full_name: "Liam O'Brien", avatar_url: "", goals: 7, assists: 8, clean_sheets: 0 },
  { id: "6", full_name: "Carlos Mendes", avatar_url: "", goals: 6, assists: 2, clean_sheets: 8 },
  { id: "7", full_name: "Tom Wilson", avatar_url: "", goals: 5, assists: 6, clean_sheets: 1 },
  { id: "8", full_name: "Ryan Cooper", avatar_url: "", goals: 3, assists: 1, clean_sheets: 3 },
];

export const mockCurrentUser: Player = {
  id: "current",
  full_name: "You",
  avatar_url: "",
  goals: 5,
  assists: 3,
  clean_sheets: 1,
};
