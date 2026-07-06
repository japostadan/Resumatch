import { createApp } from "./app.js";
import { GameStore } from "./store/index.js";

const PORT: number = Number(process.env.PORT) || 3000;

const store = new GameStore();
const app = createApp(store);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
