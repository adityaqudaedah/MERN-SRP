const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  salt: String,
  verifier: String,
  clientEphemeral: String,
  serverEphemeralPublic: String,
  serverEphemeralSecret: String,
  clientProof: String,
});

module.exports = mongoose.model("users", userSchema);
