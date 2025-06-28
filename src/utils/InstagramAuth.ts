const InstagramAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Instagram connecting...");
    // perform auth logic here...
    return true; // connected
  } else {
    console.log("🔌 Instagram disconnecting...");
    // handle disconnect logic here...
    return true; // disconnected
  }
};

export default InstagramAuth;