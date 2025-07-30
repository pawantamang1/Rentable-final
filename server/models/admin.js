import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import slug from "mongoose-slug-generator";
mongoose.plugin(slug);

const AdminUserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide a first name"],
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: [true, "Please provide a last name"],
      maxLength: 20,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "moderator", "admin"],
      default: "admin",
    },
    phoneNumber: {
      type: String,
      required: [true, "Please provide a phone number"],
      unique: true,
    },
    profileImage: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },
    accountStatus: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
AdminUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
AdminUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate access token
AdminUserSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { userId: this._id, userType: "admin", role: this.role },
    process.env.ACCESS_TOKEN_SECRET_ADMIN,
    { expiresIn: process.env.ACCESS_LIFETIME }
  );
};

// Generate refresh token
AdminUserSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { userId: this._id, userType: "admin", role: this.role },
    process.env.REFRESH_TOKEN_SECRET_ADMIN,
    { expiresIn: process.env.REFRESH_LIFETIME }
  );
};

export default mongoose.model("AdminUser", AdminUserSchema);
