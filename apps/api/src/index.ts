import app from "./app.js";
import { logger } from "@repo/logger"

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
