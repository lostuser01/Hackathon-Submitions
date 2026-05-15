import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createClientInstance = () => supabase;

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const uploadComplaintImage = async (
  file: File,
  complaintId: string,
  bucket = "images",
) => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${complaintId}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `complaint_images/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("🧨 Upload failed:", error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  return urlData.publicUrl || null;
};
