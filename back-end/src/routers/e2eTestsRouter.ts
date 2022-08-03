import { Router } from "express";
import e2etestsController from "../controllers/e2etestsController.js";

const e2eRouter = Router();

e2eRouter.post("/reset", e2etestsController.reset);

export default e2eRouter;