import { supabase } from "./supabase";

export const signUp = async (
  email: string,
  password: string
) => {
  const result = await supabase.auth.signUp({
    email,
    password,
  });

  const user = result.data.user;

  if (user) {
    await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          full_name: email.split("@")[0],
        },
      ]);
  }

  return result;
};

export const signIn = async (
  email: string,
  password: string
) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};