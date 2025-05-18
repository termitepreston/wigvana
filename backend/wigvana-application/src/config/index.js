import Joi from "joi";

const envVarsSchema = Joi.object({
	NODE_ENV: Joi.string().valid("development", "test", "production").required(),
	PORT: Joi.number().default(3000),
	MONGO_URI: Joi.string().required(),
	REDIS_URL: Joi.string().required(),
	JWT_ACCESS_SECRET: Joi.string().required(),
	JWT_REFRESH_SECRET: Joi.string().required(),
	ACCESS_TOKEN_EXPIRY: Joi.string().default("15m"),
	REFRESH_TOKEN_EXPIRY: Joi.string().default("7d"),
});

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) throw new Error(`Configuration validation error: ${error.message}.`);

export default {
	env: envVars.NODE_ENV,
	port: envVars.PORT,
	mongo: {
		url: envVars.MONGO_URI,
	},
	redis: {
		url: envVars.REDIS_URL,
	},
	jwt: {
		accessSecret: envVars.JWT_ACCESS_SECRET,
		refreshSecret: envVars.JWT_REFRESH_SECRET,
		accessExpiry: envVars.ACCESS_TOKEN_EXPIRY,
		refreshExpiry: envVars.REFRESH_TOKEN_EXPIRY,
	},
};
