import { getUsers, removeCurrentUser, setCurrentUser, setUsers } from "./storage";
import type { User } from "../types/user";

export function loginUser(email: string, password: string): User | null {
  const cleanEmail = email.trim().toLowerCase();

  const user = getUsers().find(
    (item) => item.email.toLowerCase() === cleanEmail && item.password === password
  );

  if (!user) {
    return null;
  }

  setCurrentUser(user);
  return user;
}

export function registerUser(newUser: User): { success: boolean; message?: string } {
  const users = getUsers();
  const emailExists = users.some(
    (user) => user.email.toLowerCase() === newUser.email.toLowerCase()
  );

  if (emailExists) {
    return { success: false, message: "Cet email existe déjà." };
  }

  if (!newUser.consent) {
    return {
      success: false,
      message: "Vous devez accepter l’enregistrement local des données.",
    };
  }

  setUsers([...users, newUser]);
  return { success: true };
}

export function logoutUser() {
  removeCurrentUser();
}
