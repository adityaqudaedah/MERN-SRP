require('dotenv').config()
const express = require("express");
const app = express();
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const UserModel = require("./schema/Users");
const SRP = require("secure-remote-password/server");

app.use(express.json());
app.use(cors());
const uri = process.env.PUBLIC_MONGODB_CONNECTION_STRING
mongoose.connect(uri);


app.post("/register", async (req, res) => {
  const data = req.body;
  const user = new UserModel(data);
  await user.save((err, result) => {
    if (err) {
      // console.log('error',err);
      res.send(err);
    } else {
      // console.log('result',result);
      res.send(result);
    }
  });

  // res.json(response);
});

app.post("/challenge", async (req, res) => {
  try {
    const { verifier } = await UserModel.findOne({ username: req.body.username });
  const { public: serverEphemeralPublic, secret: serverEphemeralSecret } =
    SRP.generateEphemeral(verifier);
  const doc = await UserModel.findOneAndUpdate(
    { username: req.body.username },
    {
      clientEphemeral: req.body.clientEphemeral,
      serverEphemeralSecret: serverEphemeralSecret,
      serverEphemeralPublic: serverEphemeralPublic,
    },
    { new: true }
  );
  
    res.send({
      data: {
        salt: doc.salt,
        serverEphemeralPublic: doc.serverEphemeralPublic,
      },
    });
   }
  catch (err) {
    res.send(err)
  }
  
  
});

app.post("/auth", async (req, res) => {

  try {
    const {
      serverEphemeralSecret,
      clientEphemeral,
      salt,
      username,
      verifier,
      clientProof,
    } = await UserModel.findOneAndUpdate(
      { username: req.body.username },
      {
        clientProof: req.body.clientProof,
      },
      { new: true }
    );
    const { proof: serverSessionProof, key: serverSessionKey } =
      SRP.deriveSession(
        serverEphemeralSecret,
        clientEphemeral,
        salt,
        username,
        verifier,
        clientProof
      );
  
    res.send({
      serverSessionProof: serverSessionProof,
      serverSessionKey: serverSessionKey,
    });
  } catch (error) {
    res.send(error)
  }
  
});

app.listen(process.env.PORT, () => console.log("server running"));
