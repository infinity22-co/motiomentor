import { describe, it, expect } from "vitest";
import { scoreQuiz } from "@/lib/learning";

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
