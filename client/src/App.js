import React, { useState } from "react";
import Axios from "axios";
import {
  generateSalt,
  generateEphemeral,
  derivePrivateKey,
  deriveVerifier,
  deriveSession,
  verifySession,
} from "secure-remote-password/client";
import "./App.css";

function App() {
  const [signIn, setSignIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);

  const addUserHandler = async (e) => {
    e.preventDefault();
    const salt = generateSalt();
    const privateKey = derivePrivateKey(salt, username, password);
    const verifier = deriveVerifier(privateKey);
    const user = await Axios.post("http://localhost:3001/register", {
      username,
      salt,
      verifier,
    });

    if (user.data.code) {
      alert("user already exist");
    } else {
      alert("user created");
    }
  };

  const onUserLoginHandler = async (e) => {
    e.preventDefault();
    const { public: clientEphemeral, secret: clientEphemeralSecret } =
      generateEphemeral();

    const challengeResponse = await Axios.post(
      "http://localhost:3001/challenge",
      {
        username,
        clientEphemeral,
      }
    );

    const { data } = challengeResponse.data;

    //check whether username or email and password are valid
    if (data === undefined) {
      alert("invalid username or password");
    } else {
      const { salt, serverEphemeralPublic } = data;

      const privateKey = derivePrivateKey(salt, username, password);

      const clientSession = deriveSession(
        clientEphemeralSecret,
        serverEphemeralPublic,
        salt,
        username,
        privateKey
      );

      const authResp = await Axios.post("http://localhost:3001/auth", {
        clientProof: clientSession.proof,
        username,
      });

      if (Object.keys(authResp.data).length === 0) {
        alert("invalid username or password");
      } else {
        const { serverSessionProof, serverSessionKey } = authResp.data;
        verifySession(clientEphemeral, clientSession, serverSessionProof);
        alert("login successfully");
        setIsLogin(true);
      }
    }
  };

  // useEffect(() => {
  //   first
  
  //   return () => {
  //     second
  //   }
  // }, [third])
  

  return (
    <div className="App">
      {isLogin && (
        <div>
          <h1>hello User</h1>
        </div>
      )}
      {!isLogin&&signIn && (
        <form action="submit" onSubmit={addUserHandler}>
          <h1>Sign up</h1>

          <label htmlFor="">Email</label>
          <input
            type="email"
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="">Password</label>
          <input
            type="password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button>submit</button>
        </form>
      )}
      {!signIn&&!isLogin && (
        <form action="sumbit" onSubmit={onUserLoginHandler}>
          <h1>Sign in</h1>

          <label htmlFor="">Email</label>
          <input
            type="email"
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="">Password</label>
          <input
            type="password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button>submit</button>
        </form>
      )}
      <br />
      <button
        onClick={() => {
          setSignIn(!signIn);
        }}
      >
        {signIn ? "sign in" : "sign up"}
      </button>
      <br />
      {isLogin && <button onClick={() => setIsLogin(false)}>logout</button>}
    </div>
  );
}

export default App;
