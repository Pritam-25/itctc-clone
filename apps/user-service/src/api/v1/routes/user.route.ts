import { Router } from "express";
import type { Request, Response } from "express";
import { statusCode, successResponse } from "@irctc/http";

const router: Router = Router();

router.get("/users", (req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse("List of users", {}),
  );
});

export default router;
