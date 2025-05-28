import mongoose from "mongoose";
import { isEmail } from "validator";
import argon2 from "argon2";

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		validate: [isEmail, "Invalid email."],
	},
	password: { type: String, required: true },
});

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		this.password = await argon2.hash(this.password);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return argon2.verify(this.password, candidatePassword);
};

export default mongoose.model("User", userSchema);
