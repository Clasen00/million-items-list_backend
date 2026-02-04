import express from "express";
import routes from "./routes";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = ["https://million-items-list.onrender.com/"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  }),
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

export default app;
