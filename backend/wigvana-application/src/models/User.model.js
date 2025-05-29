import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Later
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Later

const userSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(), // Use UUIDs for IDs
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			// Basic email validation, consider more robust validation or a library
			match: [/\S+@\S+\.\S+/, "is invalid"],
		},
		passwordHash: {
			type: String,
			required: true,
			private: true, // Mongoose plugin 'mongoose-private' would be needed for this to actually omit it
		},
		roles: {
			type: [String],
			enum: ["buyer", "seller", "admin"],
			default: ["buyer"],
		},
		emailVerified: {
			type: Boolean,
			default: false,
		},
		emailVerificationToken: {
			type: String,
			private: true,
		},
		emailVerificationTokenExpiresAt: {
			type: Date,
			private: true,
		},
		passwordResetToken: {
			type: String,
			private: true,
		},
		passwordResetTokenExpiresAt: {
			type: Date,
			private: true,
		},
		phoneNumber: {
			type: String,
			trim: true,
		},
		profilePictureUrl: {
			type: String,
			trim: true,
		},
		accountStatus: {
			type: String,
			enum: ["active", "suspended", "pending_verification", "deactivated"],
			default: "pending_verification", // Start as pending until email is verified
		},
		lastLoginAt: {
			type: Date,
		},
		preferredLocale: {
			type: String,

			default: "en-US",
		},
		preferredCurrency: {
			type: String,

			default: "USD",
		},
	},
	{
		timestamps: true, // Adds createdAt and updatedAt
		toJSON: {
			// transform: (doc, ret) => { // Example to remove passwordHash from JSON output
			//   delete ret.passwordHash;
			//   delete ret.emailVerificationToken;
			//   // ... delete other private fields
			//   return ret;
			// },
			getters: true,
			virtuals: true,
		},
		toObject: { getters: true, virtuals: true },
		id: false, // Disable default _id virtual, we use our own string _id
	},
);

// Indexes
userSchema.index({ roles: 1 });
userSchema.index({ accountStatus: 1 });

// Pre-save hook for password hashing
userSchema.pre("save", async function (next) {
	if (this.isModified("passwordHash")) {
		// Check if passwordHash was set/modified
		// Ensure passwordHash is not already hashed; this check might need refinement
		// Typically, you'd set a plain 'password' field and hash it to 'passwordHash'
		// For now, assuming 'passwordHash' comes in plain and needs hashing
		// this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
	}
	next();
});

// Method to compare password
/**
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Placeholder for RDF sync middleware
// userSchema.post('save', async function(doc, next) {
//   try {
//     const triples = RDFConverter.UserToTriples(doc);
//     await rdfStoreService.insertTriples(triples);
//   } catch (error) {
//     logger.error('Error syncing User to RDF store after save:', error);
//     // Decide how to handle: log, retry, etc.
//   }
//   next();
// });

// userSchema.post('remove', async function(doc, next) { // or 'deleteOne', 'deleteMany'
//   try {
//     // Construct SPARQL DELETE based on doc._id
//     // await rdfStoreService.deleteUserTriples(doc._id);
//   } catch (error) {
//     logger.error('Error deleting User from RDF store:', error);
//   }
//   next();
// });

/**
 * @typedef {mongoose.Model<mongoose.Document & typeof userSchema.methods> & typeof userSchema.statics} UserModelType
 * @type {UserModelType}
 */
const User = mongoose.model("User", userSchema);

export default User;
