import { defineConfig } from "vite";
import pure from "./pure-src/vite-pure";

export default defineConfig({
  plugins: [pure()],
});
