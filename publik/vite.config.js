import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// DATA delas med interna appen och importeras från ../src/data.js —
// fs.allow låter dev-servern läsa utanför publik/-roten.
export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: [".."] },
  },
});
