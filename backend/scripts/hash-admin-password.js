const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ override: true });

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  throw new Error("ADMIN_USERNAME et ADMIN_PASSWORD sont requis pour cette migration");
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis");
}

if (password.length < 12) {
  throw new Error("Le mot de passe doit contenir au moins 12 caractères");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrate() {
  const passwordHash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from("admins")
    .update({ password: passwordHash })
    .eq("username", username)
    .select("id, username")
    .single();

  if (error || !data) {
    throw new Error("Impossible de mettre à jour le compte admin");
  }

  console.log(`Mot de passe hashé pour ${data.username}`);
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
