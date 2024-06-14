const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ message: "token expired" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // res.status(401).json({ message: "refresh" });
    res.status(401).json({ message: "token expired" });
  }
};

module.exports = { authenticateToken };
