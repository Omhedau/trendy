import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();
const secretKey = process.env.SECRET_KEY;

const generateToken = (userId) => {
    const token = jwt.sign({ userId }, secretKey, { expiresIn: "48h" });
    return token;
}

const getUserIdFromToken = (token) => {
    const decodedToken = jwt.verify(token, secretKey);
    return decodedToken.userId;
}

const jwtProvider = {
    generateToken,
    getUserIdFromToken,
};

export default jwtProvider;
