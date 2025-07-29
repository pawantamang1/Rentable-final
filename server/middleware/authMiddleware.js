const verifyAdminAccount = async (req, res) => {
  const { token } = req.body;

  if (!token) throw new BadRequestError("Token not found");

  jwt.verify(token, process.env.EMAIL_VERIFICATION_KEY, async (error, payload) => {
    if (error) return res.status(400).json({ msg: "Invalid or expired token" });

    const admin = await AdminUser.findOne({
      accountVerificationToken: token,
      email: payload.email,
    });

    if (!admin) return res.status(400).json({ msg: "User not found" });

    admin.accountStatus = true;
    admin.accountVerificationToken = "";
    await admin.save();

    res.json({ msg: "Admin account verified successfully" });
  });
};

export { verifyAdminAccount };