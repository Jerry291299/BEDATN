import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../user"; // Adjust path accordingly

export const checkUserActiveStatus = async (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // If there's no token, return unauthorized error
  if (!token) {
    return res.status(401).json({ message: "Unauthorized, no token provided" });
  }

  try {
    // Decode the token to get the userId
    const decoded = jwt.verify(token, "your_jwt_secret") as { userId: string };

    // Find the user by ID
    const user = await User.findById(decoded.userId);

    // If user is not found or user is inactive, return forbidden status
    if (!user || !user.active) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // If the user is active, attach user to request body and proceed
    req.user = user; // Attach user info to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized, invalid token" });
  }
};
