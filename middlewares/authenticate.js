import userController from '../controller/user.js';
import jwtProvider from '../config/jwtProvider.js';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send({ error: "Authorization header not found" });
    }

    const jwt = authHeader.split(" ")[1];

    if (!jwt) {
      return res.status(401).send({ error: "Token not found" });
    }

    const userId = await jwtProvider.getUserIdFromToken(jwt);
    const user = await userController.getUserById(userId);

    if (!user) {
      return res.status(404).send({ error: `User not found with id: ${userId}` });
    }

    req.user = user; 
    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    return res.status(500).send({ error: "Failed to authenticate user" });
  }
};

export { authenticate };
