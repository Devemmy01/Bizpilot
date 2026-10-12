export function translateStatus(msg: string): string {
  if (!msg) return "";
  const lowMsg = msg.toLowerCase();

  if (lowMsg.includes("auth/invalid-credential") || lowMsg.includes("invalid-credential")) {
    return "Incorrect email or password. Please check your credentials and try again.";
  }
  if (lowMsg.includes("auth/user-not-found") || lowMsg.includes("user-not-found")) {
    return "No account found with this email. Please check your spelling or sign up.";
  }
  if (lowMsg.includes("auth/wrong-password") || lowMsg.includes("wrong-password")) {
    return "Incorrect password. Please try again or reset it.";
  }
  if (lowMsg.includes("auth/email-already-in-use") || lowMsg.includes("email-already-in-use")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lowMsg.includes("auth/weak-password") || lowMsg.includes("weak-password")) {
    return "Your password is too weak. Please use at least 6 characters.";
  }
  if (lowMsg.includes("auth/invalid-email") || lowMsg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (lowMsg.includes("auth/too-many-requests") || lowMsg.includes("too-many-requests")) {
    return "Access has been temporarily disabled due to too many failed attempts. Please try again later.";
  }
  if (lowMsg.includes("auth/network-request-failed") || lowMsg.includes("network-request-failed")) {
    return "Connection error. Please check your network and try again.";
  }
  if (lowMsg.includes("auth/popup-closed-by-user") || lowMsg.includes("popup-closed-by-user")) {
    return "Google sign-in was canceled.";
  }
  if (lowMsg.includes("could not register business") || lowMsg.includes("business creation error")) {
    return "Could not register your business. Please make sure the name is correct and try again.";
  }
  if (lowMsg.includes("could not save entry") || lowMsg.includes("error saving entry")) {
    return "Could not save daily records. Please check your inputs and try again.";
  }
  if (
    lowMsg.includes("could not email report") ||
    lowMsg.includes("error sending report") ||
    lowMsg.includes("could not generate report")
  ) {
    return "We were unable to generate or email the report. Please try again in a few moments.";
  }
  if (lowMsg.includes("could not initiate checkout")) {
    return "Could not start Flutterwave checkout. Please try again.";
  }
  if (lowMsg.includes("payment received but verification failed")) {
    return "Payment was received, but we couldn't automatically verify the subscription. Please contact support.";
  }

  return msg;
}

export function isErrorStatus(status: string) {
  return /error|fail|denied|invalid|could not|wrong|not found|weak/i.test(status);
}

export function isWarnStatus(status: string) {
  return /warning|sandbox|simulated|demo/i.test(status);
}
