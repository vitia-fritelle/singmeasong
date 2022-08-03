import { Request, Response } from "express";
import { recommendationService } from "../services/recommendationsService.js";

async function reset(req: Request, res: Response) {
    await recommendationService.reset();
    res.sendStatus(200);
}

export default {
    reset
}
