import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AudienceProvider } from "@/components/audience/audience-provider";
import { CaseStudyGrid } from "@/components/case-studies/case-study-grid";
import { StoryToggle } from "@/components/case-studies/story-toggle";
import { getAudience } from "@/lib/audiences";
import { getAllCaseStudies } from "@/lib/case-studies/loader";

describe("StoryToggle", () => {
  it("starts on the 30-second version and switches to the full story", async () => {
    render(<StoryToggle quick={<p>quick text</p>} full={<p>full text</p>} />);
    expect(screen.getByText("quick text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30-second version" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "Full story" }));
    expect(screen.getByText("full text")).toBeInTheDocument();
    expect(screen.queryByText("quick text")).not.toBeInTheDocument();
  });
});

describe("CaseStudyGrid", () => {
  beforeEach(() => localStorage.clear());

  it("orders and highlights case studies for the stored audience", () => {
    localStorage.setItem("portfolio:audience", "manager");
    render(
      <AudienceProvider>
        <CaseStudyGrid caseStudies={getAllCaseStudies()} />
      </AudienceProvider>,
    );

    const cards = screen.getAllByTestId("case-study-card");
    const expected = getAudience("manager").featured;
    expect(cards.map((c) => c.dataset.slug).slice(0, expected.length)).toEqual(expected);
    expect(within(cards[0]).getByText("Picked for: Hiring manager")).toBeInTheDocument();
  });

  it("falls back to the default audience when storage holds junk", () => {
    localStorage.setItem("portfolio:audience", "<script>");
    render(
      <AudienceProvider>
        <CaseStudyGrid caseStudies={getAllCaseStudies()} />
      </AudienceProvider>,
    );
    expect(screen.getAllByText("Picked for: Recruiter").length).toBeGreaterThan(0);
  });
});
