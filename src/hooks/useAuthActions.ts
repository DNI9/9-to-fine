import { supabase } from "../utils/supabase";

export const useAuthActions = () => {
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    }
  };

  return {
    handleLogout,
  };
};
