import { describe, expect, it } from "vitest";
import { splitCmsSections } from "./split-cms-sections";

describe("splitCmsSections", () => {
  it("uses an explicitly preferred heading level and preserves document framing in the intro", () => {
    const html = "<h2>About</h2><p>Lead</p><h3>Mission</h3><p>Mission body</p><h3>Vision</h3><p>Vision body</p>";

    const result = splitCmsSections(html, "h3");

    expect(result.intro).toBe("<h2>About</h2><p>Lead</p>");
    expect(result.sections).toHaveLength(2);
    expect(result.sections.map((section) => section.heading)).toEqual(["Mission", "Vision"]);
    expect(result.sections[0]?.html).toContain('id="mission"');
    expect(result.sections.map((section) => section.html).join(" ")).toContain("Vision body");
  });

  it("decodes HTML entities in heading text (migrated content authors smart quotes/ampersands as entities)", () => {
    const html = "<h2>Beyond Borders: China&rsquo;s Side of K2&nbsp;</h2><p>Body</p><h2>Landscapes &amp; Surroundings</h2><p>Body</p>";

    const result = splitCmsSections(html);

    expect(result.sections.map((section) => section.heading)).toEqual([
      "Beyond Borders: China’s Side of K2",
      "Landscapes & Surroundings",
    ]);
  });
});
