const jwt = require("jsonwebtoken");

const getAccessTokenUserId = (req) => {
  const { accessToken } = req.cookies;

  const decoded = jwt.decode(accessToken);

  return parseInt(decoded.id);
};

module.exports = { getAccessTokenUserId };
