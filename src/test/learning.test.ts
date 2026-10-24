import { describe, it, expect } from "vitest";
import { scoreQuiz, wantsStudyPack } from "@/lib/learning";

describe("scoreQuiz", () => {
  it("recommends the method with the most style votes", () => {
    const r = scoreQuiz(["practice", "practice", "reading", "practice", "picture"], [2, 1, 3, 0, 1]);
    expect(r.recommended).toBe("practice");
    expect(r.conceptScore).toBe(5);
  });
  it("breaks a tie with picture when concept score is below half", () => {
    const r = scoreQuiz(["reading", "picture", "reading", "picture", "listening"], [0, 0, 0, 1, 0]);
    expect(r.recommended).toBe("picture");
  });
});

describe("wantsStudyPack", () => {
  it("shows the pack for a quick-notes request", () => {
    expect(wantsStudyPack("Give me quick notes for the whole chapter Motion.")).toBe(true);
    expect(wantsStudyPack("Prepare complete revision notes for the whole chapter Motion.")).toBe(true);
    expect(wantsStudyPack("Can you make notes on acceleration?")).toBe(true);
  });
  it("does not show the pack for ordinary doubts", () => {
    expect(wantsStudyPack("Why is velocity a vector?")).toBe(false);
    expect(wantsStudyPack("Draw a diagram of distance vs displacement")).toBe(false);
    expect(wantsStudyPack("I have a doubt in acceleration")).toBe(false);
  });
});
