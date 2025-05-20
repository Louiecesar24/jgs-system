import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	"https://qjnibkybkwhhjdghtqcl.supabase.co",
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbmlia3lia3doaGpkZ2h0cWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTQzNzAsImV4cCI6MjA0NDU3MDM3MH0.5H10TvB7xs4UXAtssnKCaY8XRw-HvGLK-Cl43Aic8MY"
);

export default supabase;