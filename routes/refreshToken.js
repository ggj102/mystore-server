app.post("/refreshToken", (req, res) => {
  const { refreshToken } = req.cookies;
  const accessToken = getAccessToken(req);

  if (!refreshToken) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  if (!accessToken) {
    return res.status(401).json({ message: "Invalid access token" });
  }

  try {
    const refreshTokenDecoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const accesstokenDecoded = jwt.decode(accessToken);

    if (refreshTokenDecoded.id === accesstokenDecoded.id) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken: newAccessToken });
    } else {
      res.status(401).json({ message: "User ID mismatch between tokens" });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Refresh token expired" });
    } else {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  }
});
