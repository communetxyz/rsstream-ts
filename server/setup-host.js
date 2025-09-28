import Holster from "@mblaney/holster/src/holster.js";

const holster = Holster({secure: true});
const user = holster.user();

const HOST_USER = "host";
const HOST_PASSWORD = "host_password_123";

console.log("Creating host account...");
user.create(HOST_USER, HOST_PASSWORD, (result) => {
  const doAuth = () => {
    console.log("Logging in...");
    user.auth(HOST_USER, HOST_PASSWORD, async (authResult) => {
      if (!authResult) {
        console.log("Authentication successful!");
        
        console.log("Creating invite code...");
        const enc = await holster.SEA.encrypt({code: "admin", owner: ""}, user.is);
        
        user.get("available").next("invite_codes").put({admin: enc}, (putResult) => {
          if (putResult && putResult.err) {
            console.error("Error creating invite code:", putResult);
          } else {
            console.log("Invite code 'admin' created successfully!");
          }
          
          console.log("\nSetup complete! Please set these environment variables:");
          console.log(`export HOLSTER_USER_NAME="${HOST_USER}"`);
          console.log(`export HOLSTER_USER_PASSWORD="${HOST_PASSWORD}"`);
          
          setTimeout(() => process.exit(0), 1000);
        });
      } else {
        console.error("Authentication failed:", authResult);
        process.exit(1);
      }
    });
  };

  if (result === null) {
    console.log("Host account created successfully!");
    doAuth();
  } else {
    console.log("Account already exists, attempting to login...");
    doAuth();
  }
});