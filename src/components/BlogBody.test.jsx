import { render, screen } from "@testing-library/react";
import BlogBody from "./BlogBody";

// Jest in react-scripts 5 can't resolve react-router v7's package exports, so stub the two pieces used here.
jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
    MemoryRouter: ({ children }) => <>{children}</>,
  }),
  { virtual: true }
);
const { MemoryRouter } = require("react-router-dom");

const body = `Intro with **bold** text.

## Steps
1. First step
2. Second with [gov.ie](https://www.gov.ie/en/)

### Detail
- a bullet
- [internal](https://expalapp.netlify.app/blog/x)

## Sources
- [Official page](https://www.gov.ie/en/)`;

function setup() {
  return render(
    <MemoryRouter>
      <BlogBody body={body} />
    </MemoryRouter>
  );
}

test("renders headings, ordered and bullet lists", () => {
  const { container } = setup();
  expect(screen.getByRole("heading", { level: 2, name: "Steps" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: "Detail" })).toBeInTheDocument();
  expect(container.querySelectorAll("ol li")).toHaveLength(2);
  expect(container.querySelectorAll("ul li").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText("bold").tagName).toBe("STRONG");
});

test("external links open in a new tab, site links stay in the app", () => {
  setup();
  expect(screen.getByRole("link", { name: "gov.ie" })).toHaveAttribute("target", "_blank");
  const internal = screen.getByRole("link", { name: "internal" });
  expect(internal).toHaveAttribute("href", "/blog/x");
  expect(internal).not.toHaveAttribute("target");
});

test("marks the Sources section for styling", () => {
  const { container } = setup();
  expect(container.querySelector(".blog-section-sources")).not.toBeNull();
});
