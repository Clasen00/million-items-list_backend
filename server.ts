import app from "./src/app";
import { PORT } from "./src/config/constants";

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /api/items`);
  console.log(`  GET    /api/selected`);
  console.log(`  POST   /api/selected`);
  console.log(`  PUT    /api/selected/order`);
  console.log(`  DELETE /api/selected`);
});
