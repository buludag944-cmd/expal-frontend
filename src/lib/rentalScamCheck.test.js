import { analyzeListing } from "./rentalScamCheck";

test("classic scam story is high risk", () => {
  const r = analyzeListing({
    text: "I'm working abroad so I can't do a viewing. Send the deposit by Western Union and I'll post the keys. Lots of people interested!",
    answers: { viewed: "no", payBeforeViewing: "yes" },
  });
  expect(r.level).toBe("high");
  expect(r.flags.map((f) => f.title)).toEqual(
    expect.arrayContaining(["No in-person viewing", "Mentions a money transfer service", "Keys sent by post"])
  );
  expect(r.flags.filter((f) => f.group === "viewing")).toHaveLength(1);
});

test("normal agent listing has no major warning signs", () => {
  const r = analyzeListing({
    text: "Two-bed apartment, viewings Saturday 11am with the agent. References required.",
    answers: { viewed: "scheduled", payBeforeViewing: "no", payment: "bank", price: "normal", contact: "agent", urgency: "no", abroad: "no", noQuestions: "no", idEarly: "no" },
  });
  expect(r.level).toBe("low");
  expect(r.flags).toHaveLength(0);
});

test("a couple of softer signs is medium", () => {
  const r = analyzeListing({ answers: { contact: "social", price: "cheap" } });
  expect(r.level).toBe("medium");
});
