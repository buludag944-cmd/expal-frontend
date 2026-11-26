const { prefersGoogleRedirect, popupFailureShouldRedirect } = require("./googleSignIn");

test("phones use a full-page Google sign-in", () => {
  expect(prefersGoogleRedirect("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
  expect(prefersGoogleRedirect("Mozilla/5.0 (Linux; Android 14)")).toBe(true);
  expect(prefersGoogleRedirect("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false);
});

test("a blocked popup can be retried as a full-page sign-in", () => {
  expect(popupFailureShouldRedirect({ code: "auth/popup-blocked" })).toBe(true);
  expect(popupFailureShouldRedirect({ code: "auth/popup-closed-by-user" })).toBe(false);
});
