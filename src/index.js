import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import swaggerDocs from "./config/swagger.js";
const app = express();
dotenv.config();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
swaggerDocs(app);

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
